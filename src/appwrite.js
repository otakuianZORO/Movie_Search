import { Client, Query, Databases, ID } from "appwrite";

// Environment variables with validation
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_COLLECTION_ID;

// Debug log to see what's actually loaded
console.log('Raw env values:', {
  VITE_APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
  VITE_APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  VITE_DATABASE_ID: import.meta.env.VITE_DATABASE_ID,
  VITE_COLLECTION_ID: import.meta.env.VITE_COLLECTION_ID
});

// Validate environment variables
if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
  console.error('Missing Appwrite environment variables:', {
    ENDPOINT: !!ENDPOINT,
    PROJECT_ID: !!PROJECT_ID,
    DATABASE_ID: !!DATABASE_ID,
    COLLECTION_ID: !!COLLECTION_ID
  });
  throw new Error('Missing required Appwrite environment variables');
}

// Initialize Client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

// Access DB
const database = new Databases(client);

// Functions for updating trending section
export const updateTrending = async (searchTerm, movie) => {
  try {
    // Validate input parameters
    if (!searchTerm || !movie || !movie.id) {
      throw new Error('Invalid parameters: searchTerm and movie with id are required');
    }

    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('searchTerm', searchTerm),
    ]);

    // If document exists, update the count
    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
      });
    } else {
      // Create new document
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_uri: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      });
    }
  } catch (error) {
    console.error('Error updating trending:', error);
    throw error; // Re-throw to handle in calling function
  }
};

export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count")
    ]);

    console.log('Raw trending data from database:', result.documents);
    
    // Log each movie's poster URI
    result.documents.forEach((doc, index) => {
      console.log(`Movie ${index + 1}:`, {
        searchTerm: doc.searchTerm,
        poster_uri: doc.poster_uri,
        movie_id: doc.movie_id,
        count: doc.count
      });
    });

    return result.documents;
  } catch (error) {
    console.error('Error getting trending movies:', error);
    return []; // Return empty array instead of undefined
  }
};