import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../App";
import { FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  const clearHistory = async () => {
    const result = await Swal.fire({
        title: "Clear Interview History?",
        text: "This action cannot be undone.",
        icon: "warning",
      
        showCancelButton: true,
      
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
      
        reverseButtons: true,
        focusCancel: true,
      
        width: "420px",
      
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-lg px-5",
          cancelButton: "rounded-lg px-5",
        },
      });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(ServerUrl + "/api/interview/clear-history", {
        withCredentials: true,
      });

      setInterviews([]);

      Swal.fire({
        icon: "success",
        title: "History Cleared",
        text: "All interview records have been deleted successfully.",
        confirmButtonColor: "#10b981",
      });
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to clear interview history.",
      });
    }
  };

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(
          ServerUrl + "/api/interview/get-interview",
          { withCredentials: true },
        );

        setInterviews(result.data);
      } catch (error) {
        console.log(error);
      }
    };

    getMyInterviews();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10">
      <div className="w-[90vw] lg:w-[70vw] max-w-[90%] mx-auto">
        <div className="mb-10 w-full flex items-start gap-4 flex-wrap">
          <button
            onClick={() => navigate("/")}
            className="mt-1 p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-150"
          >
            <FaArrowLeft className="text-gray-600" size={14} />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold flex-nowrap text-gray-900 tracking-tight">
              Interview History
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Track your past interviews and performance reports
            </p>
          </div>
          <div className="ml-auto">
  <button
    onClick={clearHistory}
    className="
      flex items-center gap-2
      bg-white
      border border-gray-200
      text-red-600
      px-5 py-2.5
      rounded-xl
      shadow-sm
      hover:bg-red-50
      hover:border-red-300
      hover:shadow-md
      transition-all duration-200
      font-medium
    "
  >
    🗑
    <span>Clear History</span>
  </button>
</div>
        </div>

        {interviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm py-16 px-8 text-center">

          <div className="text-6xl mb-5">🗂️</div>
        
          <h2 className="text-2xl font-semibold text-gray-900">
            No Interview History
          </h2>
        
          <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
            Looks like you haven't completed any interviews yet.
            Start your first AI interview to see detailed reports here.
          </p>
        
          <button
            onClick={() => navigate("/interview")}
            className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm"
          >
            Start New Interview
          </button>
        
        </div>
        ) : (
          <div className="grid gap-4">
            {interviews.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(`/report/${item._id}`)}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer border border-gray-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {item.role}
                    </h3>

                    <p className="text-gray-500 text-sm mt-1">
                      {item.experience} • {item.mode}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* SCORE */}
                    <div className="text-right">
                      <p className="text-xl font-semibold text-emerald-600">
                        {item.finalScore || 0}/10
                      </p>
                      <p className="text-xs text-gray-400">Overall Score</p>
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      className={`px-3.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewHistory;
