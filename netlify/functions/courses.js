exports.handler = async () => {
  const courses = [
    { id: 'c1', title: 'Curso básico de HTML', description: 'Aprende HTML desde cero', price: 10 },
    { id: 'c2', title: 'React intermedio', description: 'Componentes, hooks y estado', price: 25 }
  ]
  return { statusCode: 200, body: JSON.stringify(courses) }
}
