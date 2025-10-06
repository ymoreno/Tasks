// Script para probar el resumen de rotaciones
const axios = require('axios');

async function testRotationSummary() {
    try {
        console.log('🧪 Probando resumen de rotaciones...\n');

        const response = await axios.get('http://localhost:3001/api/weekly/rotation-summary');
        const rotationSummary = response.data.data;

        console.log('📋 Resumen de Rotaciones Actuales:');
        console.log('=====================================');

        if (rotationSummary.length === 0) {
            console.log('No hay tareas con rotación configuradas');
            return;
        }

        rotationSummary.forEach((item, index) => {
            console.log(`${index + 1}. ${item.taskName}:`);

            if (item.nestedSubtask) {
                // Caso con subtarea anidada (como Lista -> Películas -> Netflix)
                console.log(`   └─ ${item.currentSubtask} → ${item.nestedSubtask}`);
                if (item.nestedTitle) {
                    console.log(`      (${item.nestedTitle})`);
                }
            } else {
                // Caso simple (como Leer -> Extra)
                console.log(`   └─ ${item.currentSubtask}`);
                if (item.currentTitle) {
                    console.log(`      (${item.currentTitle})`);
                }
            }
            console.log('');
        });

        console.log('=====================================');
        console.log(`Total de tareas con rotación: ${rotationSummary.length}`);

        // Mostrar formato más compacto como ejemplo
        console.log('\n📝 Formato compacto:');
        rotationSummary.forEach(item => {
            let display = `${item.taskName}: ${item.currentSubtask}`;

            if (item.nestedSubtask) {
                display += ` - ${item.nestedSubtask}`;
            }

            if (item.currentTitle || item.nestedTitle) {
                const title = item.nestedTitle || item.currentTitle;
                display += ` (${title})`;
            }

            console.log(`• ${display}`);
        });

        console.log('\n✅ Prueba de resumen de rotaciones completada');

    } catch (error) {
        console.error('❌ Error probando resumen de rotaciones:', error.message);
        if (error.response) {
            console.log('📄 Respuesta del servidor:', error.response.data);
        }
    }
}

testRotationSummary();