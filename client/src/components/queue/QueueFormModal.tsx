import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Button } from '../common/Button.js';
import { Queue } from '../../types/index.js';

interface QueueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; prefix: string }) => Promise<void>;
  initialData?: Queue | null;
  isLoading?: boolean;
}

export const QueueFormModal: React.FC<QueueFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('A');
  const [errors, setErrors] = useState<{ name?: string; prefix?: string }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setPrefix(initialData.prefix);
    } else {
      setName('');
      setDescription('');
      setPrefix('A');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; prefix?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Queue name is required';
    }
    if (!prefix.trim()) {
      newErrors.prefix = 'Prefix is required';
    } else if (prefix.trim().length > 4) {
      newErrors.prefix = 'Prefix maximum length is 4 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      prefix: prefix.trim().toUpperCase(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Queue' : 'Create New Queue'}
      subtitle={
        initialData
          ? 'Update the settings and information for this queue'
          : 'Set up a new service counter or customer queue'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Queue Name *"
          placeholder="e.g. Consultation Desk, Billing, Express Counter"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          disabled={isLoading}
          autoFocus
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Input
              label="Prefix *"
              placeholder="e.g. A, VIP"
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                if (errors.prefix) setErrors({ ...errors, prefix: undefined });
              }}
              error={errors.prefix}
              helperText="e.g. A-001"
              maxLength={4}
              disabled={isLoading}
            />
          </div>
          <div className="col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="What service does this counter handle?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-border text-charcoal-900 text-sm rounded px-3 py-2 transition-colors placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Queue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
