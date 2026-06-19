import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Disclaimer from '../Disclaimer'

describe('Disclaimer Component', () => {
  it('should render general disclaimer by default', () => {
    render(<Disclaimer />)
    
    expect(screen.getByText('Important Notice')).toBeInTheDocument()
    expect(screen.getByText(/SoulAI provides content for self-exploration/)).toBeInTheDocument()
  })

  it('should render AI disclaimer', () => {
    render(<Disclaimer type="ai" />)
    
    expect(screen.getByText('AI Advisor Disclaimer')).toBeInTheDocument()
    expect(screen.getByText(/AI advisors offer spiritual guidance/)).toBeInTheDocument()
  })

  it('should render divination disclaimer', () => {
    render(<Disclaimer type="divination" />)
    
    expect(screen.getByText('Divination Disclaimer')).toBeInTheDocument()
    expect(screen.getByText(/Divination tools/)).toBeInTheDocument()
  })

  it('should render healing disclaimer', () => {
    render(<Disclaimer type="healing" />)
    
    expect(screen.getByText('Healing Disclaimer')).toBeInTheDocument()
    expect(screen.getByText(/Healing content supports emotional well-being/)).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Disclaimer className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should have correct icon for each type', () => {
    const { rerender, container } = render(<Disclaimer type="general" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    
    rerender(<Disclaimer type="ai" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    
    rerender(<Disclaimer type="divination" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    
    rerender(<Disclaimer type="healing" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('InlineDisclaimer Component', () => {
  it('should render inline disclaimer', () => {
    render(<Disclaimer type="general" />)
    
    // Check if it's rendered as inline
    const disclaimer = screen.getByText('Important Notice')
    expect(disclaimer).toBeInTheDocument()
  })
})
