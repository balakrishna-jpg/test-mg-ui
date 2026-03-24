import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import { useState, useEffect } from "react";
import TenthResultsResults from "~/components/Tenth/TenthResultsResults";
import ResultShare from "~/components/Tenth/ResultShare";
import { ChevronUp } from "lucide-react";
import logo from "~/assets/logo.svg";

interface Env {
  name: string;
  hallticketNumber: string;
  result: string;
  totalMarks: string;
  lone: string;
  l2Grade: string;
  l3Grade: string;
  matgrade: string;
  scigrade: string;
  socgrade: string;
  firstLanguages10Marks: string;
  firstLanguageResult: string;
  secondLanguageMarks: string;
  secondLanguageResult: string;
  thirdLanguageMarks: string;
  thirdLanguageResult: string;
  mathematicsMarks: string;
  mathematicsResult: string;
  scienceMarks: string;
  scienceResult: string;
  socialMarks: string;
  socialResult: string;
}

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const id = params?.id;

  const env = context?.cloudflare?.env as any;

  const envData = {
    name: env.name,
    hallticketNumber: env.hallticketNumber,

    result: env.result,
    totalMarks: env.totalMarks,
    lone: env.lone,
    l2Grade: env.l2Grade,
    l3Grade: env.l3Grade,
    matgrade: env.matgrade,
    scigrade: env.scigrade,
    socgrade: env.socgrade,
    firstLanguages10Marks: env.firstLanguages10Marks,
    firstLanguageResult: env.firstLanguageResult,
    secondLanguageMarks: env.secondLanguageMarks,
    secondLanguageResult: env.secondLanguageResult,
    thirdLanguageMarks: env.thirdLanguageMarks,
    thirdLanguageResult: env.thirdLanguageResult,
    mathematicsMarks: env.mathematicsMarks,
    mathematicsResult: env.mathematicsResult,
    scienceMarks: env.scienceMarks,
    scienceResult: env.scienceResult,
    socialMarks: env.socialMarks,
    socialResult: env.socialResult,
  }
  // If no hall ticket number is provided, return initial state
  if (!id) {
    return json({ env: envData, result: null, isInitialState: true });
  }

  try {
    // Always fetch directly from the API
    const apiUrl = `https://d1resultquery.indira-gollapudi.workers.dev/?id=${id}`;

    // Implement retry logic with exponential backoff
    let retries = 3;
    let response = null;

    while (retries > 0 && !response) {
      try {
        const res = await fetch(apiUrl, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (res.ok) {
          response = res;
          break;
        } else if (res.status === 429) { // Too Many Requests
          // Wait longer before next retry
          await new Promise(r => setTimeout(r, (4 - retries) * 1000));
        } else if (res.status >= 500) { // Server error
          await new Promise(r => setTimeout(r, 1000));
        } else {
          // Other error codes like 404, 400, etc.
          return json({
            env: envData,
            result: null,
            isInitialState: false,
            hallTicketNumber: id,
            error: `Result not found (${res.status})`
          });
        }
      } catch (e) {
        console.error("Fetch attempt failed:", e);
        await new Promise(r => setTimeout(r, 1000));
      }

      retries--;
    }

    if (!response) {
      console.error("All retry attempts failed");
      return json({
        env: envData,
        result: null,
        isInitialState: false,
        hallTicketNumber: id,
        error: "We're experiencing high traffic. Please try again in a few moments."
      });
    }

    const result = await response.json();
    console.log("API Result:", result);

    return json({ env: envData, result, isInitialState: false, hallTicketNumber: id });
  } catch (error) {
    console.error("Error fetching results:", error);
    return json({
      env: envData,
      result: null,
      isInitialState: false,
      hallTicketNumber: id,
      error: "Unable to fetch results. Please try again later."
    });
  }
};

export default function ResultIdPage() {
  const {
    result: initialResult,
    isInitialState,
    hallTicketNumber: initialHallTicket,
    error: serverError,
    env
  } = useLoaderData<typeof loader>();

  const [hallTicket, setHallTicket] = useState(initialHallTicket || "");
  const [error, setError] = useState(serverError || "");

  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading" || navigation.state === "submitting";

  // Clear error when hallTicket changes
  useEffect(() => {
    setError("");
  }, [hallTicket]);

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate hall ticket format
    const hallTicketRegex = /^[0-9]{9,12}$/;

    if (!hallTicket.trim()) {
      setError("Please enter a hall ticket number");
      return;
    }

    if (!hallTicketRegex.test(hallTicket)) {
      setError("Please enter a valid 9-12 digit hall ticket number");
      return;
    }

    // Use Remix's submit function to trigger a new page load
    submit(null, {
      method: "get",
      action: `/result/${hallTicket}`,
    });
  };

  return (
    <div className="min-h-screen bg-opacity-30 bg-gradient-to-br from-[#fde2e4] to-white py-7 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <h1 className="text-[#e73030] text-3xl font-bold">Aadhan</h1>
        </div>

        <div>
          {/* Header with Logo if not showing results yet */}
          {isInitialState && (
            <div className="p-4 flex flex-col items-center">
              <img src={logo} alt="Aadhan" className="w-12 h-12 mb-2" />
              <h2 className="text-lg font-bold text-gray-800 font-butler">
                Telangana SSC Results 2025
              </h2>
            </div>
          )}

          {/* Hall Ticket Input Form */}
          <div className="p-1">
            <Form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-3 w-full">
                <input
                  type="text"
                  id="hallTicket"
                  value={hallTicket}
                  onChange={(e) => setHallTicket(e.target.value)}
                  className="rounded-3xl px-4 py-3 bg-white border border-transparent hover:border-pink-300 text-gray-900 w-full focus:outline-none text-sm shadow-md"
                  placeholder="Enter Hall Ticket "
                  maxLength={12}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="submit"
                  className="rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 text-sm shadow-md disabled:opacity-70 mx-auto"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "GET RESULTS"}
                </button>
              </div>

              {error && (
                <div className="mt-2 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </Form>

            {isLoading && (
              <div className="mt-3 text-center py-2">
                <p className="text-gray-600 text-sm">Loading your results...</p>
                <div className="mt-2 flex justify-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results section */}
        <div className="mt-1">
          {!isLoading && (
            <TenthResultsResults
              result={initialResult}
              isInitialState={isInitialState}
              error={error}
              env={env}
            />
          )}
        </div>

        <div className="mt-3  mr-4 flex justify-end">
          <ResultShare
            img="https://static.aadhan.in/mainImages/ssc_results.jpeg"
            url="https://goto.aadhan.in/html/te/300425060704386"
          />
        </div>
        <div className="mt-10 sm:mt-32 md:mt-40 flex flex-col items-center space-y-2 sm:space-y-3">
          <div className="-mb-2">
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </div>
          <span className="text-sm sm:text-base md:text-lg text-gray-600 text-center">
            Swipe up for more news
          </span>
        </div>

      </div>
    </div>
  );
}