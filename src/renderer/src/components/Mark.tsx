import { logoDataUri } from '@shared/logo'

type MarkProps = {
  className?: string
}

export function Mark({ className }: MarkProps) {
  return <img src={logoDataUri} alt="Creative Studio by TLS Group" className={className} />
}
