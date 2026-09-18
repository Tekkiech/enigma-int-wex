import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';

import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

$(document).ready(function () {
  $('#myTable').DataTable({
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    responsive: true,
    createdRow: function (row, data, dataIndex) {
      const cells = row.querySelectorAll('td');

      // first cell is the Category column - style it as a tag
      cells[0].classList.add('category-tag');

      // columns 0 and 1 are text (Category, Sector), the rest are numbers
      for (let i = 2; i < cells.length; i++) {
        const val = parseFloat(cells[i].textContent.trim());
        if (!isNaN(val) && val >= 1.0) {
          cells[i].classList.add('above-average');
        }
      }
    }
  });
});
