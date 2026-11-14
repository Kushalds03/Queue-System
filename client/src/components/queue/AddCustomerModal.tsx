import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Input } from '../common/Input.js';
import { Button } from '../common/Button.js';
import { UserPlus } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { customerName: string; customerPhone?: string; notes?: string }) => Promise<void>;
  queueName: string;
  prefix: string;
  isLoading?: boolean;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  queueName,
  prefix,
  isLoading = false,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setError(undefined);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    await onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Customer to Queue"
      subtitle={`Adding to "${queueName}" (${prefix}-series)`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Customer Name *"
          placeholder="e.g. John Doe, Maria Garcia"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (error) setError(undefined);
          }}
          error={error}
          disabled={isLoading}
          autoFocus
        />

        <Input
          label="Phone Number (Optional)"
          placeholder="e.g. +1 555-0199"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase">
            Service Notes / Reason (Optional)
          </label>
          <input
            placeholder="e.g. Needs document review, prescription pickup"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white border border-border text-charcoal-900 text-sm rounded px-3 py-2 transition-colors placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Issue Token
          </Button>
        </div>
      </form>
    </Modal>
  );
};

