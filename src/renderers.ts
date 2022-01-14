export function renderTable(tabular: any ): string {
    let schema = tabular.schema;
    let headers = schema.map(ht => `<th>${ht.header}</th>`).join('')
    function cell(cell_data: any) {
        if (cell_data === null)
        {
            return "<td />";
        }
        if (typeof cell_data === 'object') {
            if (cell_data.hasOwnProperty('d')) {
                return `<td>${cell_data.d}</td>`;
            }
            else {
                return "<td />";
            }
        }
        else
        {
            return `<td>${cell_data}</td>`;
        }
    }

    function r1(row_data) {
        return `<tr>${row_data.map(cell).join('')}</tr>`;
    }
    let rows = tabular.rows.map(r1).join('');
    return `<table><tr>${headers}</tr>${rows}</table>`;
}