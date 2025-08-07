import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoInfoPanel from '../VideoInfoPanel';

// Mock video data for testing
const mockVideo = {
  id: '1',
  url: 'https://example.com/video.mp4',
  title: 'Test Video Title That Is Very Long And Should Be Truncated When Displayed',
  description: 'This is a test video description that is quite long and should demonstrate the text truncation and expansion functionality properly. It contains multiple sentences to test the line clamping feature.',
  likes: 1250000,
  comments: 45000,
  views: 2500000,
  timestamp: '2025-01-30T20:00:00Z',
  author: {
    name: 'Test Creator',
    avatar: 'https://example.com/avatar.jpg',
    verified: true
  }
};

const mockVideoNext = {
  id: '2',
  url: 'https://example.com/video2.mp4',
  title: 'Next Video Title',
  description: 'Next video description',
  likes: 500000,
  comments: 12000,
  views: 800000
};

describe('VideoInfoPanel', () => {
  describe('Current Video Mode', () => {
    it('renders video information correctly', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
      expect(screen.getByText(mockVideo.description)).toBeInTheDocument();
      expect(screen.getByText('Test Creator')).toBeInTheDocument();
      expect(screen.getByText('2.5M')).toBeInTheDocument(); // Views
      expect(screen.getByText('1.3M')).toBeInTheDocument(); // Likes
      expect(screen.getByText('45.0K')).toBeInTheDocument(); // Comments
    });

    it('displays author information with verification badge', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      expect(screen.getByText('Test Creator')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument(); // Verification badge
    });

    it('shows action buttons for current video', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      expect(screen.getByText('Like')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('handles title expansion correctly', async () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      const titleElement = screen.getByText(mockVideo.title);
      expect(titleElement).toHaveClass('line-clamp-2');
      
      fireEvent.click(titleElement);
      
      await waitFor(() => {
        expect(titleElement).toHaveClass('line-clamp-none');
      });
    });

    it('handles description expansion correctly', async () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      const descriptionElement = screen.getByText(mockVideo.description);
      expect(descriptionElement).toHaveClass('line-clamp-3');
      
      fireEvent.click(descriptionElement);
      
      await waitFor(() => {
        expect(descriptionElement).toHaveClass('line-clamp-none');
      });
    });

    it('calls callback functions when clicked', () => {
      const onTitleClick = jest.fn();
      const onDescriptionClick = jest.fn();
      const onAuthorClick = jest.fn();
      
      render(
        <VideoInfoPanel 
          video={mockVideo} 
          onTitleClick={onTitleClick}
          onDescriptionClick={onDescriptionClick}
          onAuthorClick={onAuthorClick}
        />
      );
      
      fireEvent.click(screen.getByText(mockVideo.title));
      expect(onTitleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByText(mockVideo.description));
      expect(onDescriptionClick).toHaveBeenCalledTimes(1);
      
      fireEvent.click(screen.getByText('Test Creator'));
      expect(onAuthorClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Next Video Mode', () => {
    it('renders next video information correctly', () => {
      render(<VideoInfoPanel video={mockVideoNext} isNext={true} isDarkMode={false} />);
      
      expect(screen.getByText('Up Next')).toBeInTheDocument();
      expect(screen.getByText(mockVideoNext.title)).toBeInTheDocument();
      expect(screen.getByText(mockVideoNext.description)).toBeInTheDocument();
    });

    it('does not show author information for next video', () => {
      render(<VideoInfoPanel video={mockVideoNext} isNext={true} isDarkMode={false} />);
      
      expect(screen.queryByText('Test Creator')).not.toBeInTheDocument();
    });

    it('does not show action buttons for next video', () => {
      render(<VideoInfoPanel video={mockVideoNext} isNext={true} isDarkMode={false} />);
      
      expect(screen.queryByText('Like')).not.toBeInTheDocument();
      expect(screen.queryByText('Comment')).not.toBeInTheDocument();
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('shows preview thumbnail for next video', () => {
      render(<VideoInfoPanel video={mockVideoNext} isNext={true} isDarkMode={false} />);
      
      const thumbnail = screen.getByRole('button', { hidden: true }); // Play button in thumbnail
      expect(thumbnail).toBeInTheDocument();
    });

    it('uses smaller text sizes for next video', () => {
      render(<VideoInfoPanel video={mockVideoNext} isNext={true} isDarkMode={false} />);
      
      const titleElement = screen.getByText(mockVideoNext.title);
      expect(titleElement).toHaveClass('text-sm');
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode styles correctly', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={true} />);
      
      // Check if dark mode gradient is applied
      const container = screen.getByText(mockVideo.title).closest('div');
      expect(container?.parentElement?.previousElementSibling).toHaveClass('bg-gradient-to-t');
    });
  });

  describe('Number Formatting', () => {
    it('formats large numbers correctly', () => {
      const videoWithLargeNumbers = {
        ...mockVideo,
        likes: 1500000,
        comments: 250000,
        views: 5200000
      };
      
      render(<VideoInfoPanel video={videoWithLargeNumbers} isDarkMode={false} />);
      
      expect(screen.getByText('5.2M')).toBeInTheDocument(); // Views
      expect(screen.getByText('1.5M')).toBeInTheDocument(); // Likes
      expect(screen.getByText('250.0K')).toBeInTheDocument(); // Comments
    });

    it('formats small numbers correctly', () => {
      const videoWithSmallNumbers = {
        ...mockVideo,
        likes: 500,
        comments: 25,
        views: 1200
      };
      
      render(<VideoInfoPanel video={videoWithSmallNumbers} isDarkMode={false} />);
      
      expect(screen.getByText('1.2K')).toBeInTheDocument(); // Views
      expect(screen.getByText('500')).toBeInTheDocument(); // Likes
      expect(screen.getByText('25')).toBeInTheDocument(); // Comments
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive text classes', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      const titleElement = screen.getByText(mockVideo.title);
      expect(titleElement).toHaveClass('text-base', 'sm:text-lg', 'md:text-xl', 'lg:text-2xl');
      
      const descriptionElement = screen.getByText(mockVideo.description);
      expect(descriptionElement).toHaveClass('text-xs', 'sm:text-sm', 'md:text-base');
    });
  });

  describe('Accessibility', () => {
    it('provides proper title attributes for truncated text', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      const titleElement = screen.getByText(mockVideo.title);
      expect(titleElement).toHaveAttribute('title', mockVideo.title);
      
      const descriptionElement = screen.getByText(mockVideo.description);
      expect(descriptionElement).toHaveAttribute('title', mockVideo.description);
    });

    it('has proper cursor styles for interactive elements', () => {
      render(<VideoInfoPanel video={mockVideo} isDarkMode={false} />);
      
      const titleElement = screen.getByText(mockVideo.title);
      expect(titleElement).toHaveClass('cursor-pointer');
      
      const descriptionElement = screen.getByText(mockVideo.description);
      expect(descriptionElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Error Handling', () => {
    it('handles missing optional properties gracefully', () => {
      const minimalVideo = {
        id: '1',
        url: 'https://example.com/video.mp4',
        title: 'Minimal Video',
        description: 'Minimal description',
        likes: 100,
        comments: 10
      };
      
      expect(() => {
        render(<VideoInfoPanel video={minimalVideo} isDarkMode={false} />);
      }).not.toThrow();
      
      expect(screen.getByText('Minimal Video')).toBeInTheDocument();
      expect(screen.getByText('Minimal description')).toBeInTheDocument();
    });
  });
});
