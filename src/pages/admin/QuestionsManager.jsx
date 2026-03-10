import { useEffect, useState } from "react"
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi"
import api from "../../api/apiClient"

import CreateQuestionModal from "../../components/modals/CreateQuestionModal"
import EditQuestionModal from "../../components/modals/EditQuestionModal"

const QuestionsManager = () => {

  const [questions, setQuestions] = useState([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const [loading, setLoading] = useState(true)

  /* =========================
     CARGAR PREGUNTAS
  ========================= */

  const loadQuestions = async () => {

    try {

      const data = await api.get("/api/questions")

      setQuestions(data)

    } catch (err) {

      console.error("Error cargando preguntas")

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    loadQuestions()

  }, [])

  /* =========================
     ELIMINAR PREGUNTA
  ========================= */

  const handleDelete = async (id) => {

    if (!confirm("¿Desactivar esta pregunta?")) return

    try {

      await api.delete(`/api/questions/${id}`)

      loadQuestions()

    } catch (err) {

      console.error("Error eliminando pregunta")

    }

  }

  /* =========================
     EDITAR
  ========================= */

  const handleEdit = (question) => {

    setSelectedQuestion(question)
    setEditOpen(true)

  }

  return (

    <div className="p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center">

        <h2 className="text-2xl font-semibold">
          Preguntas del formulario
        </h2>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
        >
          <FiPlus />
          Nueva pregunta
        </button>

      </div>

      {/* LISTA */}

      {loading ? (

        <div>Cargando preguntas...</div>

      ) : (

        <div className="space-y-3">

          {questions.map(q => (

            <div
              key={q.id}
              className="flex justify-between items-center border rounded-lg p-4"
            >

              <div>

                <div className="font-medium">
                  {q.question}
                </div>

                {q.is_required && (
                  <span className="text-xs text-gray-500">
                    Obligatoria
                  </span>
                )}

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => handleEdit(q)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FiEdit size={18} />
                </button>

                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FiTrash2 size={18} />
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

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