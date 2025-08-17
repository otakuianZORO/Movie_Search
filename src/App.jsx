import { useState, useEffect } from "react";
import Search from "./components/Search";
import { useDebounce } from 'react-use'
import Spinner from "./components/Spinner"
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateTrending } from "./appwrite";

const App = () => {
  // API setup
  const API_BASE_URL = 'https://api.themoviedb.org/3';
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  
  const API_OPTIONS = {
    method: "GET",
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`
    }
  };

  // useState setup
     const [movies, setMovies] = useState([]);
     const [trendingLoading, setTrendingLoading] = useState(false);
const [trendingError, setTrendingError] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debounceSearch, setDebounceSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // debounce
  useDebounce(() => setDebounceSearch(searchTerm), 500, [searchTerm])

  // functions
  const fetchMovies = async (query = '') => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = query 
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
                     
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error('Failed to Fetch Movies');
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setError('No movies found');
        setMovies([]);
        return;
      }
      
      setMovies(data.results || []);
          
      if (query && data.results.length > 0) {
        await updateTrending(query, data.results[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Error in Fetching Movies");
    } finally {
      setLoading(false);
    }
  };

  const loadTrending = async () => {
  setTrendingLoading(true);
  setTrendingError('');

  try {
    const trending = await getTrendingMovies();
    if (!trending || trending.length === 0) {
      setTrendingError('No trending movies found');
      setTrendingMovies([]);
      return;
    }
    setTrendingMovies(trending || []);
  } catch (error) {
    console.error('Failed to load trending movies:', error);
    setTrendingError('Error in fetching trending movies');
    setTrendingMovies([]);
  } finally {
    setTrendingLoading(false);
  }
};

  useEffect(() => {
    fetchMovies(debounceSearch);
  }, [debounceSearch]);

  useEffect(() => {
    loadTrending();
  }, []);

  return (
    <main>
      <div className="pattern" style={{ backgroundImage: 'url(/lio.png)', backgroundSize: 'cover' }}>
        <div className='wrapper'>
          <header>
            <h1 className="shadow">
              Find Your Lovable <span className="text-gradient">Movies</span>
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>                   
          </header>
                         
      {trendingMovies.length > 0 || trendingLoading || trendingError ? (
  <section className="trending">
    <h2>Trending Movies</h2>

    {trendingLoading ? (
      <Spinner />
    ) : trendingError ? (
      <p className="text-red-500">{trendingError}</p>
    ) : (
      <ul>
        {trendingMovies.map((movie, index) => (
          <li key={movie.$id}>
            <p>{index + 1}</p>
            <img src={movie.poster_uri} alt={movie.searchTerm} />
          </li>
        ))}
      </ul>
    )}
  </section>
) : null}

                   
          <section className="all-movies">
            <h2 className="mt-[40px] text-emerald-100">ALL MOVIES</h2>
            {loading ? (
              <Spinner/>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <ul>
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie}/>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default App;