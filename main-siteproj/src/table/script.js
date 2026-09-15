import $ from 'jquery';
import 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net-responsive-dt';
import 'datatables.net-responsive-dt/css/responsive.dataTables.css';
import { bootPage } from '../theme.js';
import { colorFor } from '../data/os-colors.js';
import { loadWorldOsShare } from '../data/load-world-os-share.js';

bootPage();

function osCell(os) {
  if (!os) return '';
  return `<span class="os-cell"><span class="dot" style="background:${colorFor(os)}"></span>${os}</span>`;
}

function shareCell(share) {
  return share == null ? '' : `${share}%`;
}

async function initTable() {
  const worldOsShare = await loadWorldOsShare();

  // Every column gets its own uniquely-named field - DataTables'
  // Responsive extension tracks columns by their `data` key, and two
  // columns sharing one key (an earlier version of this reused a single
  // breakdown entry for both its "OS" and "share" columns) made it mix
  // up which value belonged to which column once it started
  // collapsing/reordering them.
  const rows = [...worldOsShare.features]
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
    .map((f) => {
      const [first, second, third] = f.properties.breakdown;
      return {
        name: f.properties.name,
        os1: first?.os ?? null,
        share1: first?.share ?? null,
        os2: second?.os ?? null,
        share2: second?.share ?? null,
        os3: third?.os ?? null,
        share3: third?.share ?? null,
      };
    });

  $('#os-table').DataTable({
    data: rows,
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    responsive: true,
    order: [[2, 'desc']],
    columns: [
      { data: 'name' },
      { data: 'os1', render: (v) => osCell(v) },
      { data: 'share1', render: (v) => shareCell(v) },
      { data: 'os2', render: (v) => osCell(v) },
      { data: 'share2', render: (v) => shareCell(v) },
      { data: 'os3', render: (v) => osCell(v) },
      { data: 'share3', render: (v) => shareCell(v) },
    ],
  });
}

initTable();
