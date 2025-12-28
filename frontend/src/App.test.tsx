import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app', () => {
    render(<App />)
    const linkElement = screen.getByText(/The Local Guide/i)
    expect(linkElement).toBeInTheDocument()
  })
})