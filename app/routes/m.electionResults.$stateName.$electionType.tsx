import React from 'react';
import ElectioResults from '~/components/ElectionsResults/ResultsMobile'
import { json } from '@remix-run/cloudflare';
import { useLoaderData, useLocation } from '@remix-run/react';
import type { LoaderFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';

export const loader: LoaderFunction = ({ request, context }: LoaderFunctionArgs) => {
  const { env } = context
  return json({ url: request?.url, env })
}

export const meta: MetaFunction = () => {
  const location = useLocation()
  return [
    { title: "Aadhan | Elections Results" },
    { name: "description", content: "Aadhan Election Results" },
    {
      property: "og:image",
      content: 'https://static.aadhan.in/mainImages/haryana_election_results.jpg',
      itemsprop: 'image',
    },
    {
      property: "og:title",
      content: 'Delhi Assembly Election results'
    },
    {
      property: "og:description",
      content: 'Catch the most Anticipated Delhi Assembly Election results updates on Aadhan!'
    },
    {
      property: "og:type",
      content: 'website'
    },
    {
      property: "og:url",
      content: 'https://elections.aadhan.in',
    },
  ];
};

const child = () => {
  const location = useLocation()
  const { url, env }: any = useLoaderData()

  return (
    <div>
      {!location.pathname.includes('widget') && (
        <div style={{
          background: "linear-gradient(to right,#36003A,#001251)",
          overflowX: "hidden",
          minHeight: "100vh",
        }}>
          <div className="w-full flex flex-col items-center">
            <div className="w-full">
              <ElectioResults />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default child

