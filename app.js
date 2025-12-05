document.addEventListener('DOMContentLoaded', () => {
    const degreeFilter = document.getElementById('degree-filter');
    const classFilter = document.getElementById('class-filter');
    const studentsTableBody = document.getElementById('students-table-body');

    let students = [];
    let degrees = [];
    let classes = [];
    let processedStudents = [];

    async function loadData() {
        try {
            const [studentsRes, degreesRes, classesRes] = await Promise.all([
                fetch('./data/students.json'),
                fetch('./data/degrees.json'),
                fetch('./data/classes.json')
            ]);

            students = await studentsRes.json();
            degrees = await degreesRes.json();
            classes = await classesRes.json();
            classes = classes.classes;

            processAndInitialize();
        } catch (error) {
            console.error('Erro ao carregar os dados:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="5">Falha ao carregar dados. Verifique o console.</td></tr>`;
        }
    }


    function processStudentData() {
        const degreesMap = new Map(degrees.map(d => [d.id, d.name]));

        processedStudents = students.map(student => {
            const classInfo = classes[student.classId];
            const degreeName = degreesMap.get(student.degreeId);
            return {
                ...student,
                className: classInfo.name,
                degreeName: degreeName,
            };
        });
    }

    function populateFilters() {
        degrees.forEach(degree => {
            const option = document.createElement('option');
            option.value = degree.id;
            option.textContent = degree.name;
            degreeFilter.appendChild(option);
        });

        classes.forEach((classe, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = classe.name;
            classFilter.appendChild(option);
        });
    }


    function renderTable() {
        studentsTableBody.innerHTML = '';

        const selectedDegree = degreeFilter.value;
        const selectedClass = classFilter.value;

        const filteredStudents = processedStudents.filter(student => {
            const degreeMatch = !selectedDegree || student.degreeId == selectedDegree;
            const classMatch = !selectedClass || student.classId == selectedClass;
            return degreeMatch && classMatch;
        });

        if (filteredStudents.length === 0) {
            studentsTableBody.innerHTML = `<tr><td colspan="5">Nenhum aluno encontrado para os filtros selecionados.</td></tr>`;
            return;
        }

        filteredStudents.forEach(student => {
            const row = document.createElement('tr');
            row.dataset.studentId = student.id;
            row.innerHTML = `
                <td>${student.ra}</td>
                <td>${student.name}</td>
                <td>${student.degreeName}</td>
                <td>${student.className}</td>
                <td>
                    <button class="action-button edit-btn">Editar</button>
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    }


    function enableEditMode(rowElement) {
        const studentId = rowElement.dataset.studentId;
        const student = processedStudents.find(s => s.id == studentId);

        const degreesOptions = degrees.map(degree => {
            const selected = degree.id === student.degreeId ? 'selected' : '';
            return `<option value="${degree.id}" ${selected}>${degree.name}</option>`
        }).join('')
        const classOptions = classes.map((classe, index) => {
            const selected = index === student.classId ? 'selected' : '';
            return `<option value="${index}" ${selected}>${classe.name}</option>`
        }).join('')

        rowElement.innerHTML = `
            <td><input id="editRa" type="number" value="${student.ra}"></td>
            <td><input id="editName" type="text" value="${student.name}"></td>
            <td>
                <select id="editDegree">${degreesOptions}</select>
            </td>
            <td>
                <select id="editClass">${classOptions}</select>
            </td>
            <td>
                <button class="action-button save-btn">Salvar</button>
                <button class="action-button cancel-btn">Cancelar</button>
            </td>
        `;
    }


    function saveChanges(rowElement) {
        const studentId = rowElement.dataset.studentId;
        const studentIndex = students.findIndex(s => s.id == studentId);

        const newRa = rowElement.querySelector('#editRa').value;
        const newName = rowElement.querySelector('#editName').value;
        const newDegreeId = rowElement.querySelector('#editDegree').value;
        const newClassId = rowElement.querySelector('#editClass').value;

        if (studentIndex !== -1) {
            students[studentIndex].ra = newRa;
            students[studentIndex].name = newName;
            students[studentIndex].degreeId = parseInt(newDegreeId);
            students[studentIndex].classId = parseInt(newClassId);
        }

        processStudentData();
        renderTable();
    }


    function handleTableClick(event) {
        const target = event.target;
        const row = target.closest('tr');

        if (target.classList.contains('edit-btn')) {
            enableEditMode(row);
        } else if (target.classList.contains('save-btn')) {
            saveChanges(row);
        } else if (target.classList.contains('cancel-btn')) {
            renderTable();
        }
    }


    function processAndInitialize() {
        populateFilters();
        processStudentData();
        renderTable();

        degreeFilter.addEventListener('change', renderTable);
        classFilter.addEventListener('change', renderTable);
        studentsTableBody.addEventListener('click', handleTableClick);
    }

    loadData();
});
