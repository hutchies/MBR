import { x as head } from "../../chunks/index.js";
import { B as BibDisplay, d as data, p as pb } from "../../chunks/data.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data$1 = data;
    async function loadData() {
      try {
        let remoteData = await pb.collection("borrowing").getFullList();
        data$1 = remoteData;
        console.log("synced with remote");
      } catch (e) {
        console.log("Unable to load remote data", e);
      }
    }
    loadData();
    head($$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Musical Borrowing &amp; Reworking: an annotated bibliography</title>`);
      });
    });
    $$renderer2.push(`<h1 class="svelte-1uha8ag">Musical Borrowing and Reworking: an annotated bibliography</h1> <div class="attribution"><div>Data from the <a href="https://web.archive.org/web/20250507173203/https://chmtl.indiana.edu/borrowing/">CHTML Musical Borrowing &amp; Reworking project</a>.</div> <div>Subject to a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a></div></div> <hr class="svelte-1uha8ag"/> `);
    BibDisplay($$renderer2, { data: data$1 });
    $$renderer2.push(`<!----> <div class="version svelte-1uha8ag">v0.14 (10 Oct 2025)</div>`);
  });
}
export {
  _page as default
};
