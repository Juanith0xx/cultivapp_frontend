import AdminClientesForm from "../components/AdminClientesForm"

const CreateAdminClient = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Crear Administrador Cliente
      </h2>

      <AdminClientForm />
    </div>
  )
}

export default CreateAdminClient