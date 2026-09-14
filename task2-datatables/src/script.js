$(document).ready(function () {
  $('#myTable').DataTable({
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    createdRow: function (row, data, dataIndex) {
      // Get all cells in the current row
      const cells = row.querySelectorAll('td');

      // Skip index 0 (Category) and index 1 (Sector), evaluate numeric values from index 2 onwards
      for (let i = 2; i < cells.length; i++) {
        const val = parseFloat(cells[i].textContent.trim());
        if (!isNaN(val) && val >= 1.0) {
          cells[i].classList.add('green');
        }
      }
    }
  });
});