import React, { useState } from 'react';
import './SemanticSearch.css';
import { IoSearch } from 'react-icons/io5';
import { API_BASE_URL } from '../lib/api';

const SemanticSearch = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);

      const response = await fetch(
        `${API_BASE_URL}/api/ai/search/semantic?query=${encodeURIComponent(query)}&limit=10`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        if (onResults) {
          onResults(data.results);
        }
      } else {
        setError('Failed to perform search');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error performing search. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setError(null);
  };

  return (
    <div className="semantic-search">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <IoSearch className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🤖 Try: 'spicy chicken', 'healthy salad', 'quick breakfast'..."
            className="search-input"
            disabled={loading}
          />
          {query && (
            <button type="button" onClick={handleClear} className="clear-btn" title="Clear search">
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-btn" disabled={loading} title="Search">
          {loading ? (
            <span className="loading-spinner">⟳</span>
          ) : (
            <>
              <IoSearch /> Search
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading && (
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Finding the best matches for you...</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div className="no-results">
          <p>😕 No results found for "{query}"</p>
          <p>Try different keywords or browse all items</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>🎯 Found {results.length} items matching your search</h3>
            <p>Sorted by relevance</p>
          </div>

          <div className="results-grid">
            {results.map((item, index) => (
              <div key={item._id || index} className="result-card">
                <div className="result-badge">{Math.round(item.similarity * 100)}% match</div>

                <div className="result-content">
                  <h4>{item.name}</h4>
                  <p className="result-description">{item.description?.substring(0, 80)}...</p>

                  <div className="result-meta">
                    <span className="result-price">₹{item.price}</span>
                    <div className="similarity-bar">
                      <div
                        className="similarity-fill"
                        style={{ width: `${item.similarity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button className="result-action">View Details →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-tips">
        <p>💡 <strong>Search Tips:</strong></p>
        <ul>
          <li>Use natural language: "I want something spicy"</li>
          <li>Describe preferences: "quick bite", "healthy", "delivery available"</li>
          <li>Mix cuisines and dietary needs</li>
        </ul>
      </div>
    </div>
  );
};

export default SemanticSearch;
