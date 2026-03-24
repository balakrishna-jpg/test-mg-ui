import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import TenthResultsResults from "~/components/Tenth/TenthResultsResults";
import ResultShare from "~/components/Tenth/ResultShare";
import { ChevronUp } from "lucide-react";
import logo from "~/assets/logo.svg";

export default function ResultIndexPage() {
  const [hallTicket, setHallTicket] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

    setIsSubmitting(true);
    navigate(`/result/${hallTicket}`);
  };

  return (
    <div className="min-h-screen   bg-opacity-30 bg-gradient-to-br from-[#fde2e4] to-white py-4">
      <div className="max-w-md mx-auto">
        <div className=" overflow-hidden">
          <div className="flex flex-col items-center pt-4 ">
            <div className="w-16 h-16 ">
              {" "}
              {/* smaller gap */}
              <img
                src={logo}
                alt="Aadhan Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-red-600 font-bold text-xl">Aadhan</h1>

            <h2 className="text-gray-800 font-medium text-center mt-10 mb-4 px-4 text-2xl">
              Telangana SSC Results 2025
            </h2>
          </div>

          {/* Input Form */}
          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-3 w-full">
                <input
                  type="text"
                  placeholder="Hall Ticket Number"
                  value={hallTicket}
                  onChange={(e) => {
                    setHallTicket(e.target.value);
                    setError("");
                  }}
                  className="rounded-3xl px-4 py-3 bg-white border border-transparent hover:border-pink-300 text-gray-900 w-full focus:outline-none text-[16px] shadow-md"
                  maxLength={12}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 text-sm shadow-md disabled:opacity-70 mx-auto"
                >
                  GET RESULT
                </button>
              </div>

              {error && (
                <div className="mt-2 text-red-600 text-base">{error}</div>
              )}
            </form>
          </div>
        </div>

        {/* Initial state placeholder */}
        <div className="mt-4">
          <TenthResultsResults result={null} isInitialState={true} />
        </div>

        <div className="mt-24 sm:mt-32 md:mt-40 flex flex-col items-center space-y-2 sm:space-y-3">
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
