import React from "react";
import { motion } from "motion/react";
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import { ServerUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return;

    // Check if the selected file is a PDF
    if (resumeFile.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    setAnalyzing(true);

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/resume",
        formData,
        { withCredentials: true },
      );

      console.log("Resume analysis result:", result.data);

      if (result.data.role && !role) {
        setRole(result.data.role);
      }
      if (result.data.experience && !experience) {
        setExperience(result.data.experience);
      }
      setProjects(result.data.projects || []);
      setSkills(result.data.skills || []);
      setResumeText(result.data.resumeText || "");
      setAnalysisDone(true);
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/generate-questions",
        { role, experience, mode, resumeText, projects, skills },
        { withCredentials: true },
      );
      console.log(result.data);
      if (userData) {
        dispatch(
          setUserData({ ...userData, credits: result.data.creditsLeft }),
        );
      }
      setLoading(false);
      onStart(result.data);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-10"
    >
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 grid md:grid-cols-2 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative bg-emerald-50/60 p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-200"
        >
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">
            Start Your AI Interview
          </h2>

          <p className="text-gray-600 mb-10 leading-relaxed">
            Practice real interview scenarios powered by AI. Improve
            communication, technical skills, and confidence.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: <FaUserTie className="text-emerald-600 text-lg" />,
                text: "Choose Role & Experience",
              },
              {
                icon: <FaMicrophoneAlt className="text-emerald-600 text-lg" />,
                text: "Smart Voice Interview",
              },
              {
                icon: <FaChartLine className="text-emerald-600 text-lg" />,
                text: "Performance Analytics",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all duration-200"
              >
                {item.icon}
                <span className="text-gray-700 font-medium text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="p-12 bg-white"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">
            Interview Setup
          </h2>

          <div className="space-y-5">
            <div className="relative">
              <FaUserTie className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={14}/>

              <input
                type="text"
                placeholder="Enter role"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all duration-150 text-sm"
                onChange={(e) => setRole(e.target.value)}
                value={role}
              />
            </div>

            <div className="relative">
              <FaBriefcase className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" size={14}/>

              <input
                type="text"
                placeholder="Experience (e.g. 2 years)"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all duration-150 text-sm"
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
              />
            </div>

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all duration-150 text-sm text-gray-700"
            >
              <option value="Technical">Technical Interview</option>
              <option value="HR">HR Interview</option>
            </select>

            {!analysisDone && (
              <div
                onClick={() => document.getElementById("resumeUpload").click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors duration-200"
              >
                <FaFileUpload className="text-3xl mx-auto text-emerald-600 mb-3" />

                <input
                  type="file"
                  accept="application/pdf"
                  id="resumeUpload"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />

                <p className="text-gray-600 font-medium text-sm">
                  {resumeFile
                    ? resumeFile.name
                    : "Click to upload resume (Optional)"}
                </p>

                {resumeFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadResume();
                    }}
                    className="mt-4 bg-neutral-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors duration-150"
                  >
                    {analyzing ? "Analyzing..." : "Analyze Resume"}
                  </button>
                )}
              </div>
            )}

            {analysisDone && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  Resume Analysis Result
                </h3>

                {projects.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2 text-sm">Projects:</p>

                    <div className="space-y-3">
                      {projects.map((project, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {project.name}
                          </h4>

                          <p className="text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {project.technologies && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {project.technologies.map((tech, index) => (
                                  <span
                                    key={index}
                                    className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-full text-xs"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1 text-sm">Skills:</p>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              onClick={handleStart}
              disabled={!role || !experience || loading}
              whileTap={{ scale: 0.98 }}
              className="w-full disabled:bg-gray-300 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-full text-sm font-semibold transition-colors duration-150 shadow-sm"
            >
              {loading ? "Starting..." : "Start Interview"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Step1SetUp;
