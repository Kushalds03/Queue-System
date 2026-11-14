import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { QueueFormModal } from '../queue/QueueFormModal.js';
import { useToast } from '../../context/ToastContext.js';
import { queueApi } from '../../services/api.js';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createQueueModalOpen, setCreateQueueModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleCreateQueue = async (data: { name: string; description?: string; prefix: string }) => {
    try {
      setIsSubmitting(true);
      await queueApi.createQueue(data);
      success(`Queue "${data.name}" created successfully!`);
      setCreateQueueModalOpen(false);
      // Notify components to refresh queue lists
      window.dispatchEvent(new Event('queue:created'));
    } catch (err: any) {
      error(err.message || 'Failed to create queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-charcoal-900 flex flex-col">
      <Navbar
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onOpenCreateQueue={() => setCreateQueueModalOpen(true)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <QueueFormModal
        isOpen={createQueueModalOpen}
        onClose={() => setCreateQueueModalOpen(false)}
        onSubmit={handleCreateQueue}
        isLoading={isSubmitting}
      />
    </div>
  );
};
