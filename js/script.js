let products = [];
let originalOrder = [];
let currentSort = { key: null, direction: 1 };
let chart = null; // Variable para almacenar la instancia de Chart.js

// Iconos de categorías
const categoryIcons = {
    'Cuentas Fijas': '💡',
    'Comida': '🍔',
    'Entretenimiento': '🎉',
    'Electrodomésticos': '🔌',
    'Ferretería': '🛠️',
    'Farmacia': '💊',
    'Indulgencias': '🍰'
};

// Colores de categorías
const categoryColors = {
    'Cuentas Fijas': '#FF6384',
    'Comida': '#36A2EB',
    'Entretenimiento': '#FFCE56',
    'Electrodomésticos': '#4BC0C0',
    'Ferretería': '#9966FF',
    'Farmacia': '#FF9F40',
    'Indulgencias': '#8BC34A'
};

document.addEventListener('DOMContentLoaded', (event) => {
    loadProductsFromStorage();
    displayProducts();
    calculateTotalPayments(); // Calcular pagos totales al cargar
    calculateCategorySummary(); // Calcular resumen de deuda por categoría
});

// Función para abrir el modal
function openModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('productModal').style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('productModal').style.display = 'none';
    clearForm();
}

// Función para agregar un producto
function addProduct() {
    const productName = document.getElementById('productName').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productInstallments = parseInt(document.querySelector('input[name="productInstallments"]:checked').value);
    const productCategory = document.getElementById('productCategory').value;
    const currentDate = new Date(); // Capturar la fecha actual

    // Calcular la fecha de fin
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + productInstallments - 1); // -1 porque empieza el mismo mes

    // Verificar si los campos están completos y son válidos
    if (!productName || isNaN(productPrice) || isNaN(productInstallments) || !productCategory) {
        console.log('Error: Por favor, completa todos los campos correctamente.');
        alert('Por favor, completa todos los campos correctamente.');
        return;
    }

    // Crear un objeto de producto
    const product = {
        name: productName,
        price: productPrice,
        installments: productInstallments,
        category: productCategory,
        startDate: currentDate,
        endDate: endDate
    };

    // Agregar el producto a las listas
    products.push(product);
    originalOrder.push(product);
    console.log("Producto agregado:", product);
    displayProducts(); // Actualizar la lista de productos
    clearForm(); // Limpiar el formulario
    saveProductsToStorage(); // Guardar productos en localStorage
    closeModal(); // Cerrar el modal
    calculateTotalPayments(); // Calcular pagos totales
    calculateCategorySummary(); // Calcular resumen de deuda por categoría
}

// Función para mostrar los productos
function displayProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Limpiar la lista de productos

    // Iterar sobre los productos y agregarlos al HTML
    products.forEach((product, index) => {
        const startDate = product.startDate ? new Date(product.startDate) : new Date();
        const endDate = product.endDate ? new Date(product.endDate) : new Date(startDate);

        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <span class="product-name"><strong>${categoryIcons[product.category]}</strong> ${product.name}</span>
            <span class="product-price"><strong>Precio:</strong> $${product.price.toFixed(2)}</span>
            <span class="product-installments"><strong>Cuotas:</strong> ${product.installments}</span>
            <span class="product-category"><strong>Categoría:</strong> ${product.category}</span>
            <span class="product-start-date"><strong>Fecha de inicio:</strong> ${startDate.toLocaleDateString()}</span>
            <span class="product-end-date"><strong>Fecha de fin:</strong> ${endDate.toLocaleDateString()}</span>
            <button onclick="removeProduct(${index})">&times;</button>
        `;
        productList.appendChild(productItem);
    });

    console.log("Lista de productos actualizada:", products);
}

// Función para limpiar el formulario
function clearForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCategory').value = '';
    const checkedRadio = document.querySelector('input[name="productInstallments"]:checked');
    if (checkedRadio) {
        checkedRadio.checked = false;
    }
}

// Función para eliminar un producto
function removeProduct(index) {
    console.log(`Producto eliminado:`, products[index]);
    products.splice(index, 1); // Eliminar el producto de la lista
    originalOrder.splice(index, 1); // Eliminar el producto del orden original
    displayProducts(); // Actualizar la lista de productos
    saveProductsToStorage(); // Guardar productos en localStorage
    calculateTotalPayments(); // Calcular pagos totales
    calculateCategorySummary(); // Calcular resumen de deuda por categoría
}

// Función para calcular los pagos totales
function calculateTotalPayments() {
    const payments = [];
    const productCount = [];
    const productDetails = [];

    // Calcular los pagos mensuales
    products.forEach(product => {
        const monthlyPayment = product.price / product.installments;
        let paymentDate = new Date(product.startDate);

        for (let i = 0; i < product.installments; i++) {
            paymentDate.setMonth(paymentDate.getMonth() + 1);
            const paymentKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

            if (!payments[paymentKey]) {
                payments[paymentKey] = 0;
                productCount[paymentKey] = 0;
                productDetails[paymentKey] = [];
            }

            payments[paymentKey] += monthlyPayment;
            productCount[paymentKey] += 1;
            productDetails[paymentKey].push({ name: product.name, payment: monthlyPayment.toFixed(2), category: product.category });
        }
    });

    // Mostrar los pagos mensuales
    const totalPayments = document.getElementById('totalPayments');
    totalPayments.innerHTML = '<h2>Pagos Mensuales:</h2>';
    for (let paymentKey in payments) {
        const [year, month] = paymentKey.split('-');
        const paymentItem = document.createElement('div');
        paymentItem.className = 'payment-item';
        paymentItem.innerHTML = `
            <div class="payment-item-header" onclick="toggleDetails(this)">
                <p><strong>${getMonthName(month)} ${year}:</strong> <span>$${payments[paymentKey].toFixed(2)} (${productCount[paymentKey]} productos)</span></p>
                <button class="toggle-button">Ver más</button>
            </div>
            <div class="payment-details">
                <div class="details-text"></div>
            </div>
        `;

        const paymentDetails = paymentItem.querySelector('.details-text');

        // Dividir productos por categoría y calcular total por categoría
        const productsByCategory = groupBy(productDetails[paymentKey], 'category');
        for (let category in productsByCategory) {
            const categoryTotal = productsByCategory[category].reduce((total, detail) => total + parseFloat(detail.payment), 0).toFixed(2);
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'category-group';
            categoryGroup.innerHTML = `
                <div class="category-header">
                    <span class="category-icon" style="background-color: ${getCategoryColor(category)}">${categoryIcons[category]}</span>
                    <span>${category}</span> - <strong>Total: $${categoryTotal}</strong>
                </div>
            `;
            productsByCategory[category].forEach(detail => {
                categoryGroup.innerHTML += `<p class="product-item"><strong>${detail.name}:</strong> $${detail.payment}</p>`;
            });
            paymentDetails.appendChild(categoryGroup);
        }

        totalPayments.appendChild(paymentItem);

        // Crear la gráfica de dona para cada mes
        const ctx = document.createElement('canvas');
        ctx.width = 100;
        ctx.height = 100;
        const donutChartContainer = document.createElement('div');
        donutChartContainer.className = 'donut-chart-container';
        donutChartContainer.appendChild(ctx);
        const donutChartCenterText = document.createElement('div');
        donutChartCenterText.className = 'donut-chart-center-text';
        donutChartCenterText.textContent = `$${payments[paymentKey].toFixed(2)}`;
        donutChartContainer.appendChild(donutChartCenterText);
        paymentItem.querySelector('.payment-details').prepend(donutChartContainer);

        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: productDetails[paymentKey].map(detail => detail.name),
                datasets: [{
                    data: productDetails[paymentKey].map(detail => parseFloat(detail.payment)),
                    backgroundColor: productDetails[paymentKey].map(detail => getCategoryColor(detail.category)),
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        console.log(`${getMonthName(month)} ${year}: $${payments[paymentKey].toFixed(2)} (${productCount[paymentKey]} productos)`);
    }
}

// Función para calcular el resumen de deuda por categoría
function calculateCategorySummary() {
    const categorySummary = {};
    let totalDebt = 0;

    // Inicializar todas las categorías en cero
    Object.keys(categoryIcons).forEach(category => {
        categorySummary[category] = 0;
    });

    // Calcular la deuda total y la deuda por categoría
    products.forEach(product => {
        categorySummary[product.category] += product.price;
        totalDebt += product.price;
    });

    // Mostrar el resumen de deuda por categoría en HTML
    const debtSummaryElement = document.getElementById('debtSummary');
    debtSummaryElement.innerHTML = '';
    for (let category in categorySummary) {
        const percentage = totalDebt ? (categorySummary[category] / totalDebt * 100).toFixed(2) : '0.00';
        const summaryItem = document.createElement('div');
        summaryItem.className = 'debt-summary-item';
        summaryItem.innerHTML = `
            <span class="category-color" style="background-color: ${getCategoryColor(category)}">
                <span class="category-icon">${categoryIcons[category]}</span>
            </span>
            <span class="category-name">${category}</span>
            <span class="category-total">$${categorySummary[category].toFixed(2)} (${percentage}%)</span>
        `;
        debtSummaryElement.appendChild(summaryItem);
    }

    // Actualizar la gráfica de dona
    updateDebtChart(categorySummary, totalDebt);

    console.log("Resumen de deuda por categoría:", categorySummary);
}

// Función para actualizar la gráfica de dona
function updateDebtChart(categorySummary, totalDebt) {
    const ctx = document.getElementById('debtChart').getContext('2d');
    const labels = Object.keys(categorySummary);
    const data = Object.values(categorySummary);
    const colors = labels.map(label => getCategoryColor(label));

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Deuda por Categoría',
                data: data,
                backgroundColor: colors,
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    display: false // Desactivar la leyenda
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.label + ': $' + tooltipItem.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    // Actualizar el texto del centro
    const chartCenterText = document.getElementById('chartCenterText');
    chartCenterText.textContent = `$${totalDebt.toFixed(2)}`;
}

// Función para obtener el nombre del mes
function getMonthName(month) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return monthNames[parseInt(month)];
}

// Función para agrupar elementos por una clave
function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
        return result;
    }, {});
}

// Función para alternar la visibilidad de los detalles del pago
function toggleDetails(button) {
    const paymentItem = button.closest('.payment-item');
    const paymentDetails = paymentItem.querySelector('.payment-details');
    const toggleButton = paymentItem.querySelector('.toggle-button');

    paymentDetails.classList.toggle('active');
    if (paymentDetails.classList.contains('active')) {
        toggleButton.textContent = 'Ver menos';
        paymentDetails.style.display = 'block';
    } else {
        toggleButton.textContent = 'Ver más';
        paymentDetails.style.display = 'none';
    }
}

// Función para ordenar productos
function sortProducts(key) {
    // Verificar si la ordenación es por la misma clave
    if (currentSort.key === key) {
        // Cambiar la dirección de la ordenación
        if (currentSort.direction === 1) {
            currentSort.direction = -1; // Cambiar a descendente
        } else if (currentSort.direction === -1) {
            currentSort.key = null; // Desactivar orden
            currentSort.direction = 1;
            products = [...originalOrder]; // Restablecer el orden original
        }
    } else {
        currentSort.key = key;
        currentSort.direction = 1; // Orden ascendente por defecto
    }

    // Ordenar los productos
    if (currentSort.key) {
        products.sort((a, b) => {
            if (a[currentSort.key] < b[currentSort.key]) return -1 * currentSort.direction;
            if (a[currentSort.key] > b[currentSort.key]) return 1 * currentSort.direction;
            return 0;
        });
    }

    console.log(`Productos ordenados por ${key} (${currentSort.direction === 1 ? 'ascendente' : currentSort.direction === -1 ? 'descendente' : 'desactivado'})`);
    updateSortButtons(); // Actualizar los botones de ordenación
    displayProducts(); // Actualizar la lista de productos
}

// Función para actualizar los botones de ordenación
function updateSortButtons() {
    const buttons = document.querySelectorAll('.sort-button');
    buttons.forEach(button => {
        button.classList.remove('active', 'desc', 'asc');
    });

    if (currentSort.key) {
        const activeButton = document.getElementById(`sort${capitalize(currentSort.key)}`);
        activeButton.classList.add('active');
        if (currentSort.direction === -1) {
            activeButton.classList.add('desc');
        } else {
            activeButton.classList.add('asc');
        }
    }
}

// Función para capitalizar la primera letra de una cadena
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Función para guardar los productos en localStorage
function saveProductsToStorage() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Función para cargar los productos de localStorage
function loadProductsFromStorage() {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
        originalOrder = [...products];
    }
}

// Función para obtener el color de una categoría
function getCategoryColor(category) {
    return categoryColors[category];
}

// Llamadas de prueba
document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();
    addProduct();
});
