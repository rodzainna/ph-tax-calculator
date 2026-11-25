import { Alert, AlertDescription } from '@/components/ui/alert'

/** Why there is no estimate, shown where the estimate would be. */
export default function ProblemAlert({ message }: { message: string }) {
  return (
    <Alert>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
