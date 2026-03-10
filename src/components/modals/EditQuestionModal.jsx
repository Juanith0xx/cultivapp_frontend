import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import api from "../../api/apiClient"

const EditQuestionModal = ({
  isOpen,
  onClose,
  onUpdated,
  question
}) => {

  const [form, setForm] = useState({
    question: "",
    is_required: false
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {

    if (question) {

      setForm({
        question: question.question || "",
        is_required: question.is_required || false
      })

    }

  }, [question])

  if (!isOpen) return null

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))

  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoading(true)
    setError("")

    try {

      await api.put(`/api/questions/${question.id}`, form)

      onUpdated()
      onClose()

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-6">

        <div className="flex justify-between items-center">

          <h3 className="text-xl font-semibold">
            Editar Pregunta
          </h3>

          <button onClick={onClose}>
            <FiX size={20}/>
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <input
            type="text"
            name="question"
            value={form.question}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <label className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              name="is_required"
              checked={form.is_required}
              onChange={handleChange}
            />

            Pregunta obligatoria

          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg"
          >

            {loading ? "Guardando..." : "Actualizar pregunta"}

          </button>

        </form>

      </div>

    </div>

  )

}

export default EditQuestionModal