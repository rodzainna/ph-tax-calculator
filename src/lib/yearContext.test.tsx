// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useYear } from './useYear.ts'
import { YearProvider } from './yearContext.tsx'

afterEach(cleanup)

const seen: { update: unknown[]; reset: unknown[]; takeId: unknown[] } = { update: [], reset: [], takeId: [] }

function Probe() {
  const { form, update, reset, takeId } = useYear()
  seen.update.push(update)
  seen.reset.push(reset)
  seen.takeId.push(takeId)
  const [taken, setTaken] = useState<number[]>([])
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
      <button onClick={() => update((f) => ({ ...f, nextId: f.nextId + 5 }))}>use five ids</button>
      <button onClick={() => setTaken([takeId(), takeId()])}>take two ids</button>
      <output aria-label="taken">{taken.join(',')}</output>
      <output aria-label="next id">{form.nextId}</output>
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

describe('YearProvider ids', () => {
  it('hands out a different id each time, even when asked twice before the page is drawn again', async () => {
    const user = userEvent.setup()
    show()
    const first = Number(screen.getByLabelText('next id').textContent)
    await user.click(screen.getByText('take two ids'))
    expect(screen.getByLabelText('taken').textContent).toBe(`${first},${first + 1}`)
    expect(screen.getByLabelText('next id').textContent).toBe(String(first + 2))
  })

  it('does not reuse an id after a change made in between', async () => {
    const user = userEvent.setup()
    show()
    const first = Number(screen.getByLabelText('next id').textContent)
    await user.click(screen.getByText('take two ids'))
    await user.click(screen.getByText('earlier year'))
    await user.click(screen.getByText('take two ids'))
    expect(screen.getByLabelText('taken').textContent).toBe(`${first + 2},${first + 3}`)
  })
})

describe('YearProvider ids after an update', () => {
  it('carry on from the ids an update used up', async () => {
    const user = userEvent.setup()
    show()
    const first = Number(screen.getByLabelText('next id').textContent)
    await user.click(screen.getByText('use five ids'))
    await user.click(screen.getByText('take two ids'))
    expect(screen.getByLabelText('taken').textContent).toBe(`${first + 5},${first + 6}`)
  })
})

describe('YearProvider actions', () => {
  it('keep the same identity when the form changes, so they are safe in effect dependencies', async () => {
    const user = userEvent.setup()
    seen.update.length = 0
    seen.reset.length = 0
    seen.takeId.length = 0
    show()
    await user.click(screen.getByText('type'))
    await user.click(screen.getByText('earlier year'))
    expect(seen.update.length).toBeGreaterThan(2)
    expect(new Set(seen.update).size).toBe(1)
    expect(new Set(seen.reset).size).toBe(1)
    expect(new Set(seen.takeId).size).toBe(1)
  })
})

describe('useYear', () => {
  it('says so when it is used outside the provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useYear must be used inside YearProvider')
    quiet.mockRestore()
  })
})
