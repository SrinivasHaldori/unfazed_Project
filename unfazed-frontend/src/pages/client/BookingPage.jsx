import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { SlotPicker } from '../../components/scheduling/SlotPicker';
import { IntakeFormRenderer } from '../../components/crm/IntakeFormRenderer';
import { ShieldCheck, Video, Calendar, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';

export const BookingPage = () => {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTherapistProfile = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/therapists/public/${slug}`);
        if (data.success) {
          setTherapist(data.data);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapistProfile();
  }, [slug]);

  useEffect(() => {
    if (!therapist) return;

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        const { data } = await api.get(
          `/scheduling/public-slots/${slug}?clientTimezone=${selectedTimezone}&duration=50`
        );
        if (data.success) {
          setSlots(data.slots);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [slug, therapist, selectedTimezone]);

  const handleBookingSubmit = async (clientPayload) => {
    try {
      setIsSubmitting(true);
      setBookingError(null);

      const requestData = {
        therapistSlug: slug,
        startTime: selectedSlot.startTime,
        duration: selectedSlot.duration || 50,
        timezone: selectedTimezone,
        clientData: clientPayload,
      };

      const { data } = await api.post('/scheduling/book', requestData);

      if (data.success) {
        setBookingConfirmed(data);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingError(
        err.response?.data?.message || 'Could not complete booking. Please try another slot.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading therapist practice profile...
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-2">Therapist Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">The profile link '/{slug}' is either inactive or does not exist.</p>
        <Link to="/" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation / Header Brand */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-brand-400 font-bold tracking-tight">
            <Sparkles className="h-5 w-5" />
            <span className="text-lg">Unfazed Telehealth</span>
          </div>
          <span className="text-xs text-slate-500">Secured & Encrypted Tele-Psychology (India)</span>
        </div>

        {/* Therapist Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-500/20 text-3xl font-serif font-bold text-brand-300 border border-brand-500/30">
              {therapist.name.charAt(0)}
            </div>

            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Accepting Clients Online • Immediate Confirmation</span>
              </div>

              <h1 className="font-serif text-3xl font-bold text-white">{therapist.name}</h1>
              <p className="text-sm font-medium text-brand-300">{therapist.title}</p>
              <p className="text-sm leading-relaxed text-slate-300 max-w-3xl">{therapist.bio}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                {therapist.specializations?.map((spec, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700/50"
                  >
                    {spec}
                  </span>
                ))}
                {therapist.languages?.map((lang, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 border border-brand-500/20"
                  >
                    🗣 {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Process Flow */}
        {bookingConfirmed ? (
          /* Confirmation Success State (No Payment Gateway Needed!) */
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="font-serif text-3xl font-bold text-white">Your Appointment is Confirmed!</h2>
              <p className="text-sm text-slate-400 mt-2">
                No payment was required. An instant confirmation and meeting link have been prepared.
              </p>
            </div>

            <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-850 p-6 text-left space-y-3">
              <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Therapist:</span>
                <span className="font-semibold text-white">{bookingConfirmed.therapist.name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Client:</span>
                <span className="font-semibold text-white">{bookingConfirmed.client.name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Scheduled Time:</span>
                <span className="font-semibold text-brand-300">
                  {new Date(bookingConfirmed.session.startTime).toLocaleString('en-IN', {
                    timeZone: bookingConfirmed.session.timezone,
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 items-center pt-1">
                <span>Video Room:</span>
                <a
                  href={bookingConfirmed.session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Join Session</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setBookingConfirmed(null);
                  setSelectedSlot(null);
                }}
                className="text-xs text-slate-400 underline hover:text-white"
              >
                Book another appointment
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {bookingError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                {bookingError}
              </div>
            )}

            {!selectedSlot ? (
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">1. Select Appointment Time</h3>
                <p className="text-xs text-slate-400 mb-4">
                  All sessions are 50 minutes. Times automatically adjust to your selected timezone.
                </p>
                <SlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={(slot) => setSelectedSlot(slot)}
                  loading={slotsLoading}
                  selectedTimezone={selectedTimezone}
                  onChangeTimezone={setSelectedTimezone}
                />
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-brand-400 hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Change selected time slot</span>
                </button>

                <h3 className="font-serif text-2xl font-bold text-white mb-2">2. Complete Intake & Consent</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Please complete the confidential intake questions and verify digital consent to finalize.
                </p>

                <IntakeFormRenderer
                  therapistName={therapist.name}
                  selectedSlot={selectedSlot}
                  timezone={selectedTimezone}
                  onSubmitBooking={handleBookingSubmit}
                  loading={isSubmitting}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
