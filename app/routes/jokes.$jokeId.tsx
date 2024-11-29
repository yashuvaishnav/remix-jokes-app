
import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { json, Link, useLoaderData, useParams, isRouteErrorResponse, useRouteError, Form } from "@remix-run/react";
import { useState } from "react";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const meta: MetaFunction<typeof loader> = ({
  data,
}) => {
  const { description, title } = data
    ? {
      description: `Enjoy the "${data.joke.name}" joke and much more`,
      title: `"${data.joke.name}" joke`,
    }
    : { description: "No joke found", title: "No joke" };

  return [
    { name: "description", content: description },
    { name: "twitter:description", content: description },
    { title },
  ];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  const res =
    await db.joke.findUnique({
      where: { id: params.jokeId },
    });
  if (!res) {
    throw new Response("What a joke! Not found.", {
      status: 404,
    });
  }
  return json({ joke: res, isOwner: userId === res.jokesterId, });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const form = await request.formData();

  const name = form.get('name') as string;
  const content = form.get('content') as string;
  const action = form.get('action');
  switch (action) {
    case 'update_todo':
      return await db.joke.update({
        where: { id: params.jokeId },
        data: {
          name: name?.toLowerCase(),
          content: content?.toLowerCase(),
        },
      });
  }



  if (form.get("intent") !== "delete") {
    throw new Response(
      `The Intent ${form.get("intent")} is not supported`,
      { status: 400 }
    )
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }
  if (joke.jokesterId !== userId) {
    throw new Response(
      "Pssh, nice try. That's not your joke",
      { status: 403 }
    );
  }
  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect("/jokes");
}


const SingleJoke = () => {
  const { joke, isOwner } = useLoaderData<typeof loader>();
  const [edit, setEdit] = useState(false);
  return (
    <div className="">
      <h2 className="text-[32px] text-gray-400 font-bold">Single Blog</h2>
      <div className="p-5 border bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 rounded-lg shadow-md bg-white mt-[20px]">
        {joke ? (
          <>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {joke.name}
              </h1>
            <p className="text-white">{joke.content}</p>
          </>
        ) : (
          <p className="text-gray-500 italic">Loading...</p>
        )}
        {isOwner ? (
          <div className="flex mt-[10px] justify-between">
            <Form method="post">
              {!edit ? <button
                className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                name="intent"
                type="submit"
                value="delete"
              >
                Delete
              </button> : null}
            </Form>
            {edit && (
              <Form method="POST">
                <input type="hidden" name="action" value="update_todo" />
                <input type="text" name="name" defaultValue={joke ? joke.name : ''} />
                <input type="text" name="content" defaultValue={joke ? joke.content : ''} />
                <br /><br />
                <button type="submit">submit</button>
                <span onClick={() => setEdit(false)}>              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                </span>
              </Form>
            )}
            {!edit ? <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50" onClick={() => setEdit(true)}>Edit</button> : "" }
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default SingleJoke;

export function ErrorBoundary() {
  const { jokeId } = useParams();
  const error = useRouteError();
  console.log(error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 400) {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    if (error.status === 403) {
      return (
        <div className="error-container">
          Sorry, but "{jokeId}" is not your joke.
        </div>
      );
    }
    if (error.status === 404) {
      return (
        <div className="error-container">
          Huh? What the heck is "{jokeId}"?
        </div>
      );
    }
  }

  return (
    <div className="error-container">
      There was an error loading joke by the id "${jokeId}".
      Sorry.
    </div>
  );
}