document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#relationships-table tbody');
    const degreeFilter = document.getElementById('degree-filter');
    const classFilter = document.getElementById('class-filter');

    const form = document.getElementById('add-relationship-form');
    const newTeacherSelect = document.getElementById('new-teacher');
    const newMatterSelect = document.getElementById('new-matter');
    const addPairBtn = document.getElementById('add-degree-class-pair');
    const degreeClassPairsContainer = document.getElementById('degree-class-pairs');

    let relationships = [];
    let teachers = [];
    let matters = [];
    let degrees = [];
    let classes = [];
    let students = [];

    let teachersMap = new Map();
    let mattersMap = new Map();
    let degreesMap = new Map();
    let classesMap = new Map();

    async function loadAllData() {
        try {
            const [
                relationshipsRes, teachersRes, mattersRes, degreesRes, classesRes, studentsRes
            ] = await Promise.all([
                fetch('data/relationships.json'),
                fetch('data/teachers.json'),
                fetch('data/matters.json'),
                fetch('data/degrees.json'),
                fetch('data/classes.json'),
                fetch('data/students.json')
            ]);

            relationships = await relationshipsRes.json();
            teachers = await teachersRes.json();
            matters = await mattersRes.json();
            degrees = await degreesRes.json();
            classes = await classesRes.json();
            classes = classes.classes;
            students = await studentsRes.json();

            teachersMap = new Map(teachers.map(t => [t.id, t.name]));
            mattersMap = new Map(matters.map(m => [m.id, m.name]));
            degreesMap = new Map(degrees.map(d => [d.id, d.name]));
            classesMap = new Map(classes.map((c, i) => [i, c.name]));

            populateFilters();
            populateFormSelects();
            renderTable(relationships);
            addPairBtn.click();

        } catch (error) {
            console.error('Falha ao carregar os dados:', error);
            tableBody.innerHTML = `<tr><td colspan="5">Erro ao carregar dados. Verifique o console.</td></tr>`;
        }
    }

    function populateFilters() {
        degrees.forEach(degree => {
            const option = new Option(degree.name, degree.id);
            degreeFilter.add(option);
        });
        classes.forEach((cls, i) => {
            const option = new Option(cls.name, i);
            classFilter.add(option);
        });
    }

    function populateFormSelects() {
        teachers.forEach(teacher => {
            const option = new Option(teacher.name, teacher.id);
            newTeacherSelect.add(option);
        });
        matters.forEach(matter => {
            const option = new Option(matter.name, matter.id);
            newMatterSelect.add(option);
        });
    }

    function renderTable(dataToRender) {
        tableBody.innerHTML = '';
        if (dataToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>';
            return;
        }

        dataToRender.forEach(rel => {
            const row = tableBody.insertRow();
            row.dataset.relationshipId = rel.id;

            const teacherName = teachersMap.get(rel.teacherId) || 'N/A';
            const matterName = mattersMap.get(rel.matterId) || 'N/A';

            const degreeNames = rel.degrees.map(d => degreesMap.get(d.degreeId) || 'N/A').join(', ');
            const degreeIds = rel.degrees.map(d => d.degreeId).join(',');

            const classesByDegree = rel.degrees.map(d => {
                const degreeName = degreesMap.get(d.degreeId) || 'Série Desconhecida';
                const classNames = d.classes.map(c => classesMap.get(c.classId) || `Turma ${c.classPosition || 'N/A'}`).join(', ');
                return `${degreeName}: ${classNames}`;
            }).join('<br>');

            row.innerHTML = `
                <td>${teacherName}</td>
                <td>${matterName}</td>
                <td>${degreeNames}</td>
                <td>${classesByDegree}</td>
                <td>
                    <button class="action-button generate-btn show-students-btn" data-degree-ids="${degreeIds}">
                        Ver Alunos
                    </button>
                </td>
            `;
        });
    }

    function applyFilters() {
        const selectedDegree = degreeFilter.value;
        const selectedClass = classFilter.value;

        const filteredData = relationships.filter(rel => {
            const degreeMatch = !selectedDegree || rel.degrees.some(d => d.degreeId == selectedDegree);
            const classMatch = !selectedClass || rel.degrees.some(d => d.classes.some(c => c.classId == selectedClass));
            return degreeMatch && classMatch;
        });

        renderTable(filteredData);
    }

    function showStudents(degreeIds, targetRow) {
        const existingStudentsRow = document.querySelector('.students-display-row');
        if (existingStudentsRow) {
            existingStudentsRow.remove();
        }

        const ids = degreeIds.split(',').map(Number);
        const relatedStudents = students.filter(s => ids.includes(s.degreeId));

        const studentsRow = tableBody.insertRow(targetRow.rowIndex);
        studentsRow.className = 'students-display-row';
        const cell = studentsRow.insertCell();
        cell.colSpan = 5;

        if (relatedStudents.length > 0) {
            const studentNames = relatedStudents.map(s => s.name).join(', ');
            cell.innerHTML = `<b>Alunos na(s) série(s):</b> ${studentNames}`;
        } else {
            cell.innerHTML = '<b>Nenhum aluno encontrado para esta(s) série(s).</b>';
        }
    }

    function addDegreeClassPair() {
        const pairCount = degreeClassPairsContainer.children.length;
        const newPairDiv = document.createElement('div');
        newPairDiv.className = 'filter-group';
        newPairDiv.style.flexDirection = 'row';
        newPairDiv.style.gap = '10px';
        newPairDiv.style.alignItems = 'center';

        const degreeSelect = document.createElement('select');
        degreeSelect.className = `new-degree-select`;
        degreeSelect.required = true;
        degreeSelect.innerHTML = `<option value="" disabled selected>Selecione a Série</option>`;
        degrees.forEach(d => degreeSelect.add(new Option(d.name, d.id)));

        const classSelect = document.createElement('select');
        classSelect.className = `new-class-select`;
        classSelect.required = true;
        classSelect.innerHTML = `<option value="" disabled selected>Selecione a Turma</option>`;
        classes.forEach((c, i) => classSelect.add(new Option(c.name, i)));

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'X';
        removeBtn.className = 'action-button cancel-btn';
        removeBtn.onclick = () => newPairDiv.remove();

        newPairDiv.append(degreeSelect, classSelect);
        if (pairCount > 0) {
            newPairDiv.append(removeBtn);
        }

        degreeClassPairsContainer.appendChild(newPairDiv);
    }

    function handleAddRelationship(event) {
        event.preventDefault();

        const newTeacherId = parseInt(newTeacherSelect.value);
        const newMatterId = parseInt(newMatterSelect.value);

        const degreePairs = {};
        const degreeSelects = document.querySelectorAll('.new-degree-select');
        const classSelects = document.querySelectorAll('.new-class-select');

        for (let i = 0; i < degreeSelects.length; i++) {
            const degreeId = parseInt(degreeSelects[i].value);
            const classId = parseInt(classSelects[i].value);

            if (!degreeId === undefined || !classId === undefined) {
                alert('Por favor, preencha todos os campos de Série e Turma.');
                return;
            }

            if (!degreePairs[degreeId]) {
                degreePairs[degreeId] = {
                    degreeId: degreeId,
                    classes: []
                };
            }
            if (!degreePairs[degreeId].classes.some(c => c.classId === classId)) {
                degreePairs[degreeId].classes.push({ classId: classId });
            }
        }

        const newRelationship = {
            id: Math.max(...relationships.map(r => r.id)) + 1,
            teacherId: newTeacherId,
            matterId: newMatterId,
            degrees: Object.values(degreePairs)
        };

        relationships.push(newRelationship);
        applyFilters();

        form.reset();
        degreeClassPairsContainer.innerHTML = '';
        addPairBtn.click();

        alert('Novo relacionamento adicionado com sucesso!');
    }

    degreeFilter.addEventListener('change', applyFilters);
    classFilter.addEventListener('change', applyFilters);

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('show-students-btn')) {
            const button = event.target;
            const degreeIds = button.dataset.degreeIds;
            const row = button.closest('tr');
            showStudents(degreeIds, row);
        }
    });

    addPairBtn.addEventListener('click', addDegreeClassPair);
    form.addEventListener('submit', handleAddRelationship);

    loadAllData();
});
