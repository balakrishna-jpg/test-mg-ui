import React from "react";
import Aadhan from '../../assets/Aadhan.svg';
import { useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';



export default function TenthResultsResults({ result, isInitialState, error, env }) {  
  

  if (isInitialState) {
    return (
      <div className="w-full mx-auto p-4 text-black min-h-32 flex flex-col items-center justify-center">

      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto bg-white p-4 rounded-xl text-black shadow-lg">
        <div className="p-4 rounded text-center">
          <h2 className="text-lg font-bold mb-2 text-red-600">Error</h2>
          <p className="mb-4 text-sm text-gray-700">{error}</p>
          <p className="text-xs text-gray-500">
             please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="w-full mx-auto bg-white p-4 rounded-xl text-gray-800 shadow-lg">
        <div className="p-4 rounded text-center">
          <h2 className="text-lg font-bold mb-2">Result Not Found</h2>
          <p className="mb-4 text-sm text-gray-600">
            No results found for the provided hall ticket number. Please check and try again.
          </p>
        </div>
      </div>
    );
  }

  const subjects = [
    {
      name: "First Language",
      marks: result?.[env?.firstLanguages10Marks] ? result[env.firstLanguages10Marks].trim() : "0",
      result: result?.[env?.firstLanguageResult] || "",
      grade: result?.[env?.lone]?.trim() || ""
    },
    {
      name: "Second Language",
      marks: result?.[env?.secondLanguageMarks] ? result[env.secondLanguageMarks].trim() : "0",
      result: result?.[env?.secondLanguageResult] || "",
      grade: result?.[env?.l2Grade]?.trim() || ""
    },
    {
      name: "Third Language",
      marks: result?.[env?.thirdLanguageMarks] ? result[env.thirdLanguageMarks].trim() : "0",
      result: result?.[env?.thirdLanguageResult] || "",
      grade: result?.[env?.l3Grade]?.trim() || ""
    },
    {
      name: "Mathematics",
      marks: result?.[env?.mathematicsMarks] ? result[env.mathematicsMarks].trim() : "0",
      result: result?.[env?.mathematicsResult] || "",
      grade: result?.[env?.matgrade]?.trim() || ""
    },
    {
      name: "Science",
      marks: result?.[env?.scienceMarks] ? result[env.scienceMarks].trim() : "0",
      result: result?.[env?.scienceResult] || "",
      grade: result?.[env?.scigrade]?.trim() || ""
    },
    {
      name: "Social Studies",
      marks: result?.[env?.socialMarks] ? result[env.socialMarks].trim() : "0",
      result: result?.[env?.socialResult] || "",
      grade: result?.[env?.socgrade]?.trim() || ""
    }
  ];

  const validSubjects = subjects.filter(subject => {
    const marks = subject.marks?.trim();
    return marks && marks !== "0" && marks !== "";
  });

  // Calculate total marks from valid subjects
  const totalMarks = validSubjects.reduce((sum, subject) => {
    // Convert marks to number and add to sum
    const markValue = parseInt(subject.marks) || 0; 
    return sum + markValue;
  }, 0);

  const getResultStatusColorClass = (status) => {
    if (!status) return "text-gray-800";
    const upperStatus = status?.toUpperCase();
    if (upperStatus.includes("FAIL")) return "text-red-600 font-bold"; // If FAIL anywhere
    return "text-green-600 font-bold"; // Otherwise, treat as pass (FIRST DIVISION, SECOND DIVISION)
  };
  

  const resultStatusColorClass = getResultStatusColorClass(result?.[env?.result]);

  return (
    <div className="w-full mx-auto pt-1 pb-4 rounded-2xl text-gray-800 bg-white shadow-md">
    {/* Upper Info Section */}
    <div className="px-4 mb-2">
  <div className="grid grid-cols-[90px_1fr] gap-y-2 items-center">
    <span className="font-bold">Hall Ticket</span>
    <span className="text-gray-600">: {result?.[env?.hallticketNumber]}</span>

    <span className="font-bold">Name</span>
    <span className="text-gray-600 break-words">: {result?.[env?.name]?.trim()}</span>

    <span className="font-bold">Result</span>
    <span className={resultStatusColorClass}>
      <span className="text-gray-600">: {totalMarks}</span> ( {result?.['RESULTS']?.trim()} )
    </span>
  </div>
</div>

    
    {/* Table Section - Without vertical borders */}
    <div>
      <div className="overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border-t border-b border-gray-200 text-left">SUBJECT</th>
              <th className="p-2 border-t border-b border-gray-200 text-center w-20">Marks</th>
              <th className="p-2 border-t border-b border-gray-200 text-center w-20">Grade</th>
              <th className="p-2 border-t border-b border-gray-200 text-center w-20">Result</th>
              
            </tr>
          </thead>
          <tbody>
  {validSubjects.map((subject, idx) => {
    const isFail = subject.result && subject.result.toUpperCase() === 'F';
    const markColorClass = isFail ? "text-red-600" : "text-gray-800";
    const resultColorClass = subject.result?.toUpperCase() === 'P' ? "text-green-600 font-bold" : "text-red-600 font-bold";

    return (
      <tr key={idx} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
        <td style={{fontSize:14}} className="p-1 border-b border-gray-200 uppercase">{subject?.name}</td>
        <td className={`p-1 border-b border-gray-200 text-center ${markColorClass} font-medium`}>
          {subject?.marks}
        </td>
        <td className={`p-1 border-b border-gray-200 text-center ${resultColorClass}`}>
          {subject?.grade || "-"}
        </td>
        <td className={`p-1 border-b border-gray-200 text-center ${resultColorClass}`}>
          {subject?.result || "-"}
        </td>
       
      </tr>
    );
  })}
</tbody>

        </table>
      </div>
    </div>
  </div>
  );
}
