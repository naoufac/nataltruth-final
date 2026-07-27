import { useState } from 'react';

const VoiceHoroscopePlayer = ({ readingId }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVoiceHoroscope = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/voice-horoscope/${readingId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      setAudioUrl(data.audioUrl);
    } catch (error) {
      console.error('Failed to fetch voice horoscope:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        onClick={fetchVoiceHoroscope}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        {isLoading ? 'Generating Voice Horoscope...' : 'Play Voice Horoscope (Premium) '}
      </button>
      {audioUrl && (
        <audio controls className="mt-2">
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

export default VoiceHoroscopePlayer;