import { Navigate, useParams } from 'react-router-dom';

/** Old bookmarks / links: `/review/:id` → canonical `/history/:id`. */
export default function ReviewRouteRedirect() {
  const { attemptId } = useParams();
  return <Navigate to={`/history/${attemptId}`} replace />;
}
