
import { json, Link, useLoaderData, isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { db } from "~/utils/db.server";

export const loader = async () => {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await db.joke.findMany({
    skip: randomRowNumber,
    take: 1,
  });
  if (!randomJoke) {
    if (!randomJoke) {
      throw new Response("No random joke found", {
        status: 404,
      });
    }
  }
  return json({ randomJoke });

};
const JokesIndexRoute = () => {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex justify-center items-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl">
      <div className="flex flex-col space-y-6 mt-[30px] mx-4 sm:mx-8 lg:mx-12  rounded-lg p-6   ">
        <h1 className="text-[32px] font-semibold text-gray-800">Here's a random joke:</h1>
        <p className="text-lg text-gray-700">{data.randomJoke.content}</p>
        <Link to={data.randomJoke.id} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300 ease-in-out">
          "{data.randomJoke.name}" Permalink
        </Link>
      </div>
    </div>

  );
};
export default JokesIndexRoute;


export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="error-container">
        <p>There are no jokes to display.</p>
        <Link to="new">Add your own</Link>
      </div>
    );
  }
  return (
    <div className="error-container">
      I did a whoopsies.
    </div>
  );
}