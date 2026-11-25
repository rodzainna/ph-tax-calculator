// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ProblemAlert from './ProblemAlert.tsx'

afterEach(cleanup)

describe('ProblemAlert', () => {
  it('announces why there is no estimate', () => {
    render(<ProblemAlert message="Check the amounts." />)
    expect(screen.getByRole('alert').textContent).toBe('Check the amounts.')
  })
})
