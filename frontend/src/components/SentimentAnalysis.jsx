import React, { useState, useEffect } from 'react';
import './SentimentAnalysis.css';
import { FaSmile, FaFrown, FaMeh } from 'react-icons/fa';
import { API_BASE_URL } from '../lib/api';

const SentimentAnalysis = ({ foodId }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSentimentAnalysis();
  }, [foodId]);

  const fetchSentimentAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/ai/sentiment/food/${foodId}`);
      const data = await response.json();

      if (data.success) {
        setSentiment(data.summary);
      } else {
        setError('Failed to fetch sentiment analysis');
      }
    } catch (err) {
      console.error('Error fetching sentiment:', err);
      setError('Error loading sentiment data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sentiment-container loading">
        <div className="loader"></div>
        <p>Analyzing reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sentiment-container error">
        <p>{error}</p>
      </div>
    );
  }

  if (!sentiment || sentiment.totalComments === 0) {
    return (
      <div className="sentiment-container empty">
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const getSentimentIcon = () => {
    if (sentiment.positive > sentiment.negative) {
      return <FaSmile className="icon positive" />;
    } else if (sentiment.negative > sentiment.positive) {
      return <FaFrown className="icon negative" />;
    } else {
      return <FaMeh className="icon neutral" />;
    }
  };

  return (
    <div className="sentiment-container">
      <div className="sentiment-header">
        <div className="sentiment-icon">{getSentimentIcon()}</div>
        <div className="sentiment-rating">
          <h3>{sentiment.rating}</h3>
          <p>{sentiment.totalComments} reviews analyzed</p>
        </div>
      </div>

      <div className="sentiment-stats">
        <div className="stat positive">
          <div className="stat-value">{sentiment.positive}</div>
          <div className="stat-label">Positive</div>
          <div className="stat-percentage">{sentiment.positivePercentage}%</div>
        </div>

        <div className="stat neutral">
          <div className="stat-value">{sentiment.neutral}</div>
          <div className="stat-label">Neutral</div>
          <div className="stat-percentage">
            {(100 - parseFloat(sentiment.positivePercentage) - parseFloat(sentiment.negativePercentage)).toFixed(2)}%
          </div>
        </div>

        <div className="stat negative">
          <div className="stat-value">{sentiment.negative}</div>
          <div className="stat-label">Negative</div>
          <div className="stat-percentage">{sentiment.negativePercentage}%</div>
        </div>
      </div>

      <div className="sentiment-bar">
        <div className="sentiment-bar-segment positive" style={{ width: `${sentiment.positivePercentage}%` }}></div>
        <div
          className="sentiment-bar-segment neutral"
          style={{
            width: `${100 - parseFloat(sentiment.positivePercentage) - parseFloat(sentiment.negativePercentage)}%`,
          }}
        ></div>
        <div className="sentiment-bar-segment negative" style={{ width: `${sentiment.negativePercentage}%` }}></div>
      </div>

      <div className="sentiment-score">
        <p>Average Sentiment Score: <strong>{sentiment.averageScore}</strong>/1.0</p>
      </div>

      <button className="refresh-btn" onClick={fetchSentimentAnalysis}>
        🔄 Refresh Analysis
      </button>
    </div>
  );
};

export default SentimentAnalysis;
