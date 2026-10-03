'use client'
import { Modal } from './modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isDangerous?: boolean
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', isDangerous = false
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => { onConfirm(); onClose() }}
              className={isDangerous ? 'btn-danger flex-1' : 'btn-primary flex-1'}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
