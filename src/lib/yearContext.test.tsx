// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useYear } from './useYear.ts'
import { YearProvider } from './yearContext.tsx'

afterEach(cleanup)

const seen: { update: unknown[]; reset: unknown[] } = { update: [], reset: [] }

function Probe() {
  const { form, update, reset } = useYear()
  seen.update.push(update)
  seen.reset.push(reset)
  return (
    <>
      <output aria-label="basic">{form.employers[0].basic}</output>
      <output aria-label="year">{form.year}</output>
      <button onClick={() => update((f) => ({ ...f, employers: [{ ...f.employers[0], basic: '35000' }] }))}>
        type
      </button>
      <button onClick={() => update((f) => ({ ...f, year: f.year - 1 }))}>earlier year</button>
      <button
        onClick={() => {
          update((f) => ({ ...f, year: f.year - 1 }))
          update((f) => ({ ...f, year: f.year - 1 }))
        }}
      >
        two years back
      </button>
      <button onClick={reset}>reset</button>
    </>
  )
}

const show = () =>
  render(
    <YearProvider>
      <Probe />
    </YearProvider>,
  )

describe('YearProvider', () => {
  it('starts with a blank form', () => {
    show()
    expect(screen.getByLabelText('basic').textContent).toBe('')
  })

  it('shares an update with everything inside it', async () => {
    const user = userEvent.setup()
    render(
      <YearProvider>
        <Probe />
        <Probe />
      </YearProvider>,
    )
    await user.click(screen.getAllByText('type')[0])
    expect(screen.getAllByLabelText('basic').map((el) => el.textContent)).toEqual(['35000', '35000'])
  })

  it('builds each update on the latest form, so two in the same event both count', async () => {
    const user = userEvent.setup()
    show()
    const start = Number(screen.getByLabelText('year').textContent)
    await user.click(screen.getByText('two years back'))
    expect(screen.getByLabelText('year').textContent).toBe(String(start - 2))
  })

  it('goes back to a blank form on reset', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByText('type'))
    await user.click(screen.getByText('reset'))
    expect(screen.getByLabelText('basic').textContent).toBe('')
  })
})

describe('YearProvider actions', () => {
  it('keep the same identity when the form changes, so they are safe in effect dependencies', async () => {
    const user = userEvent.setup()
    seen.update.length = 0
    seen.reset.length = 0
    show()
    await user.click(screen.getByText('type'))
    await user.click(screen.getByText('earlier year'))
    expect(seen.update.length).toBeGreaterThan(2)
    expect(new Set(seen.update).size).toBe(1)
    expect(new Set(seen.reset).size).toBe(1)
  })
})

describe('useYear', () => {
  it('says so when it is used outside the provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useYear must be used inside YearProvider')
    quiet.mockRestore()
  })
})
