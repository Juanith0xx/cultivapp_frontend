import { useEffect, useState } from "react"
import api from "../../api/apiClient"

const UserForm = () => {

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
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
     CAMBIO DE RESPUESTA
  ========================= */

  const handleChange = (id, value) => {

    setAnswers(prev => ({
      ...prev,
      [id]: value
    }))

  }

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = (e) => {

    e.preventDefault()

    console.log("Respuestas:", answers)

    // aquí después enviaremos al backend

  }

  if (loading) return <div>Cargando formulario...</div>

  return (

    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow">

      <h2 className="text-xl font-semibold mb-6">
        Formulario de información
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">

        {questions.map(q => (

          <div key={q.id}>

            <label className="block text-sm font-medium mb-1">
              {q.question}
            </label>

            <input
              type="text"
              required={q.is_required}
              value={answers[q.id] || ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

          </div>

        ))}

        <button
          type="submit"
          className="w-full bg-[#87be00] text-white py-2 rounded-lg"
        >
          Guardar respuestas
        </button>

      </form>

    </div>

  )

}

export default UserForm