// src/app/projetos/page.tsx - COM DASHBOARD LAYOUT
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 Gestão de Projetos</h1>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Página Funcionando!</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              ✅ A página de projetos agora está usando o DashboardLayout correto
            </p>
            
            <p className="text-gray-600">
              🕐 Carregada em: {new Date().toLocaleString()}
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Próximos Passos:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Navegação lateral funcionando</li>
                <li>• Layout consistente com outras páginas</li>
                <li>• Pronto para adicionar funcionalidades</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Este é um teste básico. Quando confirmar que funciona, 
                podemos adicionar a lista de projetos e funcionalidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}