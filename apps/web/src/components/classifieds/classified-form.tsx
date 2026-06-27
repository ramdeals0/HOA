'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type ClassifiedFormValues = {
  title: string;
  description: string;
  category: string;
  priceCents: string;
  contactEmail: string;
};

export function ClassifiedForm({
  initialValues,
  submitLabel,
  pendingLabel = 'Saving...',
  onSubmit,
}: {
  initialValues: ClassifiedFormValues;
  submitLabel: string;
  pendingLabel?: string;
  onSubmit: (values: ClassifiedFormValues) => Promise<void>;
}) {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save classified.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
      />
      <Input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="Price ($)"
        value={form.priceCents}
        onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
      />
      <Input
        type="email"
        placeholder="Contact email"
        value={form.contactEmail}
        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

export function classifiedFormToPayload(form: ClassifiedFormValues) {
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    contactEmail: form.contactEmail || undefined,
    priceCents: form.priceCents ? Math.round(parseFloat(form.priceCents) * 100) : undefined,
  };
}

export function classifiedToFormValues(listing: {
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  contactEmail: string | null;
}): ClassifiedFormValues {
  return {
    title: listing.title,
    description: listing.description,
    category: listing.category,
    priceCents: listing.priceCents != null ? (listing.priceCents / 100).toFixed(2) : '',
    contactEmail: listing.contactEmail ?? '',
  };
}
