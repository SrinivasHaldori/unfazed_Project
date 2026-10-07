const mongoose = require('mongoose');
const Session = require('../models/Session');
const Client = require('../models/Client');
const entitlementService = require('../services/entitlementService');

class AnalyticsController {
  /**
   * Pipeline 1: Total Sessions Per Month
   * Groups sessions by year-month string in therapist's timezone,
   * aggregating volume breakdowns across statuses and total clinical minutes.
   */
  async getMonthlySessionVolume(therapistId, monthsCount = 12) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsCount);

    return Session.aggregate([
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(therapistId),
          startTime: { $gte: cutoffDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$startTime',
              timezone: 'Asia/Kolkata',
            },
          },
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          noShowSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] },
          },
          bookedUpcoming: {
            $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] },
          },
          totalClinicalHours: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $divide: ['$duration', 60] },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalSessions: 1,
          completedSessions: 1,
          cancelledSessions: 1,
          noShowSessions: 1,
          bookedUpcoming: 1,
          totalClinicalHours: { $round: ['$totalClinicalHours', 1] },
        },
      },
      { $sort: { month: 1 } },
    ]);
  }

  /**
   * Pipeline 2: Active Client Retention Count & Engagement Cohorts
   * Evaluates longitudinal client return patterns:
   * identifies 1-time dropouts vs. repeat retained clients (>= 2 sessions)
   * and long-term therapeutic relationships (>= 5 sessions).
   */
  async getClientRetentionMetrics(therapistId) {
    const pipeline = [
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(therapistId),
        },
      },
      {
        $group: {
          _id: '$client_id',
          totalBooked: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          firstSessionDate: { $min: '$startTime' },
          lastSessionDate: { $max: '$startTime' },
        },
      },
      {
        $facet: {
          overallSummary: [
            {
              $group: {
                _id: null,
                totalClientsEngaged: { $sum: 1 },
                retainedClients: {
                  $sum: { $cond: [{ $gte: ['$completedSessions', 2] }, 1, 0] },
                },
                singleSessionClients: {
                  $sum: { $cond: [{ $eq: ['$completedSessions', 1] }, 1, 0] },
                },
                longTermRetainedClients: {
                  $sum: { $cond: [{ $gte: ['$completedSessions', 5] }, 1, 0] },
                },
                avgSessionsPerClient: { $avg: '$completedSessions' },
              },
            },
            {
              $project: {
                _id: 0,
                totalClientsEngaged: 1,
                retainedClients: 1,
                singleSessionClients: 1,
                longTermRetainedClients: 1,
                avgSessionsPerClient: { $round: ['$avgSessionsPerClient', 1] },
                retentionRatePercentage: {
                  $cond: [
                    { $gt: ['$totalClientsEngaged', 0] },
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$retainedClients', '$totalClientsEngaged'] },
                            100,
                          ],
                        },
                        1,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          ],
          retentionCohorts: [
            {
              $bucket: {
                groupBy: '$completedSessions',
                boundaries: [0, 1, 2, 5, 10, 50],
                default: '50+ Sessions',
                output: {
                  clientCount: { $sum: 1 },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          summary: { $arrayElemAt: ['$overallSummary', 0] },
          cohorts: '$retentionCohorts',
        },
      },
    ];

    const results = await Session.aggregate(pipeline);
    return results[0] || { summary: {}, cohorts: [] };
  }

  /**
   * Pipeline 3: No-Show & Cancellation Rates
   * Computes reliable operational percentages:
   * cancellation rate, no-show rate, and completion reliability index.
   */
  async getNoShowAndCancellationRates(therapistId) {
    const pipeline = [
      {
        $match: {
          therapist_id: new mongoose.Types.ObjectId(therapistId),
        },
      },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          noShows: {
            $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] },
          },
          upcomingBooked: {
            $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalAppointments: 1,
          completed: 1,
          cancelled: 1,
          noShows: 1,
          upcomingBooked: 1,
          cancellationRate: {
            $cond: [
              { $gt: ['$totalAppointments', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$cancelled', '$totalAppointments'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
          noShowRate: {
            $cond: [
              { $gt: ['$totalAppointments', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$noShows', '$totalAppointments'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
          completionRate: {
            $cond: [
              { $gt: ['$totalAppointments', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$completed', '$totalAppointments'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    const results = await Session.aggregate(pipeline);
    return (
      results[0] || {
        totalAppointments: 0,
        completed: 0,
        cancelled: 0,
        noShows: 0,
        upcomingBooked: 0,
        cancellationRate: 0,
        noShowRate: 0,
        completionRate: 0,
      }
    );
  }

  /**
   * Consolidated Endpoint: Fetches all analytics in parallel.
   * Gated strictly via entitlementService for 'advanced_analytics'.
   */
  async getDashboardAnalytics(req, res) {
    try {
      const therapistId = req.therapist._id;

      // Entitlement feature check
      const entitlement = await entitlementService.canAccess(therapistId, 'advanced_analytics');
      if (!entitlement.allowed) {
        return res.status(403).json({
          success: false,
          error: 'FEATURE_LOCKED',
          message: 'Advanced practice analytics is a Pro and Clinic tier feature.',
          upgradePrompt: entitlement.upgradePrompt,
        });
      }

      // Execute all 3 MongoDB aggregations concurrently
      const [monthlySessions, retentionMetrics, reliabilityRates] = await Promise.all([
        this.getMonthlySessionVolume(therapistId),
        this.getClientRetentionMetrics(therapistId),
        this.getNoShowAndCancellationRates(therapistId),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          monthlySessions,
          retentionMetrics,
          reliabilityRates,
        },
      });
    } catch (error) {
      console.error(`[Analytics Aggregation Error] ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AnalyticsController();
