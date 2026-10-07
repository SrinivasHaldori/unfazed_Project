import React, { useState } from 'react';
import { ShieldCheck, HeartHandshake, User, Phone, Mail, CheckCircle2 } from 'lucide-react';

export const IntakeFormRenderer = ({
  therapistName,
  selectedSlot,
  timezone,
  onSubmitBooking,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Prefer not to say',
    emergencyContactName: '',
    emergencyContactPhone: '',
    previousTherapy: false,
    presentingConcern: '',
    goals: '',
    consentGiven: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.consentGiven) {
      alert('You must provide digital consent before confirming the session.');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      consentGiven: true,
      consentTextVersion: 'v1.0-india-telehealth',
      intakeData: {
        demographics: {
          dob: formData.dob ? new Date(formData.dob) : null,
          gender: formData.gender,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
        },
        medicalHistory: {
          previousTherapy: formData.previousTherapy,
        },
        presentingConcern: formData.presentingConcern,
        goals: formData.goals,
      },
    };

    onSubmitBooking(payload);
  };

  const slotTimeFormatted = selectedSlot
    ? new Date(selectedSlot.startTime).toLocaleString('en-IN', {
        timeZone: timezone,
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="font-serif text-xl font-bold text-white">Client Intake & Consent</h3>
        <p className="text-xs text-slate-400 mt-1">
          Booking session with <span className="font-semibold text-brand-300">{therapistName}</span> for{' '}
          <span className="font-semibold text-white">{slotTimeFormatted}</span>
        </p>
      </div>

      {/* Basic Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Full Legal Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Priya Mukherjee"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="priya@example.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Phone Number (WhatsApp) *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Emergency Contact (Name & Phone) *</label>
          <input
            type="text"
            name="emergencyContactName"
            required
            value={formData.emergencyContactName}
            onChange={handleChange}
            placeholder="e.g. Rahul (Partner) - 9876543211"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Presenting Concerns & Goals */}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">
            What is bringing you to therapy at this time?
          </label>
          <textarea
            name="presentingConcern"
            rows={3}
            value={formData.presentingConcern}
            onChange={handleChange}
            placeholder="Share what is currently feeling challenging (e.g. work burnout, anxiety, relationship distress)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="previousTherapy"
            name="previousTherapy"
            checked={formData.previousTherapy}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="previousTherapy" className="text-xs text-slate-300">
            I have attended psychotherapy or counseling before.
          </label>
        </div>
      </div>

      {/* Mandatory Auditable Digital Consent */}
      <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Telehealth Digital Consent & Confidentiality Agreement</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          I hereby consent to participate in tele-mental health services with {therapistName}. I understand that therapy sessions are strictly confidential according to Indian mental health ethics, except in cases of imminent risk of harm to self or others. I understand that sessions are confirmed immediately upon booking.
        </p>
        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="consentGiven"
            name="consentGiven"
            required
            checked={formData.consentGiven}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-brand-500 bg-slate-950 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="consentGiven" className="text-xs font-medium text-slate-100">
            I have read, understood, and digitally signed this informed consent agreement with timestamp audit recording. *
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !formData.consentGiven}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-95 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{loading ? 'Confirming Appointment...' : 'Confirm Appointment (Instant)'}</span>
        </button>
      </div>
    </form>
  );
};
