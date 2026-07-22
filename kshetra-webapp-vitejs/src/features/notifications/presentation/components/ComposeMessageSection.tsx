import { Input, Textarea } from '@/shared/ui'

import { ComposeViewField } from '@/features/notifications/presentation/components/ComposeViewField'

interface ComposeMessageSectionProps {
  mode: 'view' | 'edit'
  title: string
  description: string
  titleError?: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

/** Title + description card of the compose form. */
export function ComposeMessageSection({ mode, title, description, titleError, onTitleChange, onDescriptionChange }: ComposeMessageSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-5.5 shadow-sm">
      <span className="text-2xs font-semibold uppercase tracking-overline text-ink-subtle">Message</span>
      {mode === 'edit' ? (
        <>
          <Input
            label="Title"
            required
            placeholder="e.g. Ashadha Ekadashi special pooja"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            error={titleError}
          />
          <Textarea
            label="Description"
            rows={3}
            placeholder="Message shown in the app notification."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </>
      ) : (
        <>
          <ComposeViewField label="Title" value={title} />
          <ComposeViewField label="Description" value={description} />
        </>
      )}
    </section>
  )
}
