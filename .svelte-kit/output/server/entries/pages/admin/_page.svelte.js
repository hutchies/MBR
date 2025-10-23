import { x as head, y as attr } from "../../../chunks/index.js";
import { d as data, B as BibDisplay } from "../../../chunks/data.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data$1 = data;
    Math.max(...data$1.map((d) => d.record)) + 1;
    let user = "";
    let pwd = "";
    console.log("data updated", data$1);
    head($$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Musical Borrowing &amp; Reworking: admin</title>`);
      });
    });
    $$renderer2.push(`<h1 class="svelte-1jef3w8">Musical Borrowing and Reworking: admin</h1> <div class="attribution"><div>Data from the <a href="https://web.archive.org/web/20250507173203/https://chmtl.indiana.edu/borrowing/">CHTML Musical Borrowing &amp; Reworking project</a>.</div> <div>Subject to a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a></div></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<hr class="svelte-1jef3w8"/> <b>You must log in to access editing tools.</b> <div>Username: <input type="text"${attr("value", user)}/></div> <div>Password: <input type="password"${attr("value", pwd)}/></div> <div><button>Log in</button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <hr class="svelte-1jef3w8"/>`);
    }
    $$renderer2.push(`<!--]--> `);
    BibDisplay($$renderer2, { data: data$1 });
    $$renderer2.push(`<!----> <div class="version svelte-1jef3w8">v0.14 (10 Oct 2025)</div>`);
  });
}
export {
  _page as default
};
