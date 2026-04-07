import { useEffect, useState } from "react"
import { FiEdit, FiTrash2, FiPlus, FiHelpCircle, FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import api from "../../api/apiClient"
import { toast } from "react-hot-toast"

import CreateQuestionModal from "../../components/modals/CreateQuestionModal"
import EditQuestionModal from "../../components/modals/EditQuestionModal"

const QuestionsManager = () => {
  const [questions, setQuestions] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await api.get("/questions")
      setQuestions(data)
    } catch (err) {
      console.error("Error cargando preguntas")
      toast.error("Error al cargar el cuestionario")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) return

    try {
      await api.delete(`questions/${id}`)
      toast.success("Pregunta eliminada")
      loadQuestions()
    } catch (err) {
      toast.error("No se pudo eliminar la pregunta")
    }
  }

  const handleEdit = (question) => {
    setSelectedQuestion(question)
    setEditOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-[Outfit]">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            Formulario
          </h2>
          <p className="text-[10px] font-bold text-[#87be00] uppercase tracking-[0.3em] mt-2">
            Configuración de preguntas para mercaderistas
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-[#87be00] hover:bg-[#76a500] text-white px-6 py-3 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-[#87be00]/20"
        >
          <FiPlus size={18} />
          Nueva Pregunta
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                <FiHelpCircle size={14}/> Estructura del Reporte Actual
            </span>
            <span className="text-[10px] font-black text-[#87be00] uppercase bg-[#87be00]/10 px-3 py-1 rounded-full">
                {questions.length} Items
            </span>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-300">
                <div className="w-8 h-8 border-4 border-[#87be00] border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando campos...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center">
                <FiAlertCircle size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No hay preguntas configuradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="group flex justify-between items-center bg-white border border-gray-100 rounded-[2rem] p-6 hover:border-[#87be00] hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-6">
                    {/* Indicador de número */}
                    <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black italic group-hover:bg-[#87be00]/10 group-hover:text-[#87be00] transition-colors">
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-black text-gray-800 uppercase tracking-tighter leading-tight mb-1">
                        {q.question}
                      </p>
                      <div className="flex gap-2">
                        {q.is_required ? (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                            <FiCheckCircle size={10} /> Obligatoria
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">
                            Opcional
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">|</span>
                        <span className="text-[9px] font-bold text-[#87be00] uppercase tracking-widest">
                           {q.type || 'Texto'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleEdit(q)}
                      className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateQuestionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadQuestions}
      />

      <EditQuestionModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        question={selectedQuestion}
        onUpdated={loadQuestions}
      />

    </div>
  )
}

export default QuestionsManager