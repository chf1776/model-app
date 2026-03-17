use scraper::{Html, Selector};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ScalematesKitData {
    pub scalemates_id: String,
    pub name: Option<String>,
    pub manufacturer: Option<String>,
    pub scale: Option<String>,
    pub kit_number: Option<String>,
    pub category: Option<String>,
    pub box_art_url: Option<String>,
    pub manual: Option<ScalematesManual>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScalematesManual {
    pub pdf_url: String,
    pub is_exact_match: bool,
    pub source_kit_name: Option<String>,
    pub source_kit_year: Option<String>,
}

/// Build a reqwest blocking client with browser-like headers.
pub fn build_client() -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(10))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))
}

/// Extract the Scalemates numeric ID from a URL like
/// `scalemates.com/kits/tamiya-35190-m4-sherman--103541`
pub fn extract_scalemates_id(url: &str) -> Option<String> {
    // Pattern: last segment after "--" in the URL path
    let path = url.split('?').next().unwrap_or(url);
    let path = path.split('#').next().unwrap_or(path);
    if let Some(pos) = path.rfind("--") {
        let id_part = &path[pos + 2..];
        // Strip any trailing slash
        let id_part = id_part.trim_end_matches('/');
        if !id_part.is_empty() && id_part.chars().all(|c| c.is_ascii_digit()) {
            return Some(id_part.to_string());
        }
    }
    None
}

/// Normalize scale from "1:35" to "1/35" format.
fn normalize_scale(raw: &str) -> String {
    raw.trim().replace(':', "/")
}

/// Map Scalemates category terms to app category values.
fn map_category(topic_text: &str) -> Option<String> {
    let lower = topic_text.to_lowercase();
    if lower.contains("ship") || lower.contains("naval") || lower.contains("vessel") || lower.contains("boat") || lower.contains("submarine") {
        Some("ship".to_string())
    } else if lower.contains("aircraft") || lower.contains("aviation") || lower.contains("airplane") || lower.contains("helicopter") {
        Some("aircraft".to_string())
    } else if lower.contains("armor") || lower.contains("tank") || lower.contains("armour") {
        Some("armor".to_string())
    } else if lower.contains("vehicle") || lower.contains("car") || lower.contains("truck") || lower.contains("motorcycle") {
        Some("vehicle".to_string())
    } else if lower.contains("figure") || lower.contains("person") || lower.contains("people") {
        Some("figure".to_string())
    } else if lower.contains("sci-fi") || lower.contains("space") || lower.contains("fantasy") || lower.contains("science fiction") {
        Some("sci_fi".to_string())
    } else {
        None
    }
}

/// Parse a Scalemates kit page HTML into structured data.
pub fn parse_kit_page(html: &str, url: &str) -> ScalematesKitData {
    let document = Html::parse_document(html);
    let scalemates_id = extract_scalemates_id(url).unwrap_or_default();

    let name = parse_name(&document);
    let (manufacturer, scale, kit_number, category) = parse_facts(&document);
    let box_art_url = parse_box_art(&document, url);
    let manual = parse_manual(&document, html, url);

    ScalematesKitData {
        scalemates_id,
        name,
        manufacturer,
        scale,
        kit_number,
        category,
        box_art_url,
        manual,
    }
}

/// Extract kit name from <h1> tag.
fn parse_name(document: &Html) -> Option<String> {
    let sel = Selector::parse("h1").ok()?;
    document.select(&sel).next().map(|el| {
        el.text().collect::<String>().trim().to_string()
    }).filter(|s| !s.is_empty())
}

/// Extract manufacturer, scale, kit number, and category from the <dl> facts section.
fn parse_facts(document: &Html) -> (Option<String>, Option<String>, Option<String>, Option<String>) {
    let mut manufacturer = None;
    let mut scale = None;
    let mut kit_number = None;
    let mut category = None;

    let dl_sel = Selector::parse("dl").ok();
    let dt_sel = Selector::parse("dt").ok();
    let dd_sel = Selector::parse("dd").ok();
    let a_sel = Selector::parse("a").ok();

    if let (Some(dl_s), Some(dt_s), Some(dd_s)) = (dl_sel, dt_sel, dd_sel) {
        for dl in document.select(&dl_s) {
            let dts: Vec<_> = dl.select(&dt_s).collect();
            let dds: Vec<_> = dl.select(&dd_s).collect();

            for (dt, dd) in dts.iter().zip(dds.iter()) {
                let label = dt.text().collect::<String>().trim().to_lowercase();
                let value = dd.text().collect::<String>().trim().to_string();

                if label.starts_with("brand") {
                    if !value.is_empty() {
                        manufacturer = Some(value);
                    }
                } else if label.starts_with("scale") {
                    if !value.is_empty() {
                        scale = Some(normalize_scale(&value));
                    }
                } else if label.starts_with("number") {
                    if !value.is_empty() {
                        kit_number = Some(value);
                    }
                } else if label.starts_with("topic") {
                    if let Some(a_s) = &a_sel {
                        for a in dd.select(a_s) {
                            let href = a.value().attr("href").unwrap_or("");
                            let text = a.text().collect::<String>();
                            if href.contains("category.php") || text.starts_with('»') || text.starts_with("»") {
                                let clean_text = text.replace('»', "").replace("»", "").trim().to_string();
                                if let Some(cat) = map_category(&clean_text) {
                                    category = Some(cat);
                                }
                            }
                        }
                    }
                    if category.is_none() {
                        category = map_category(&value);
                    }
                }
            }
        }
    }

    (manufacturer, scale, kit_number, category)
}

/// Extract box art image URL.
fn parse_box_art(document: &Html, page_url: &str) -> Option<String> {
    let sel = Selector::parse("img").ok()?;
    for img in document.select(&sel) {
        let src = img.value().attr("src").unwrap_or("");
        let alt = img.value().attr("alt").unwrap_or("").to_lowercase();
        // Box art images are in /products/img/ and have "boxart" or "pristine" in src/alt
        if (src.contains("/products/img/") && (alt.contains("boxart") || src.contains("pristine")))
            || (src.contains("/products/img/") && src.contains("-10000-"))
        {
            return Some(make_absolute_url(src, page_url));
        }
    }
    None
}

/// Parse instruction manual links from the page.
fn parse_manual(document: &Html, html: &str, page_url: &str) -> Option<ScalematesManual> {
    let a_sel = Selector::parse("a").ok()?;

    // Check if this is an exact match or related boxing
    let is_related = html.contains("don't have the exact instruction")
        || html.contains("don&#39;t have the exact instruction")
        || html.contains("don\u{2019}t have the exact instruction");

    for a in document.select(&a_sel) {
        let href = a.value().attr("href").unwrap_or("");
        let title = a.value().attr("title").unwrap_or("").to_lowercase();

        let is_manual_link = href.contains("instructions.pdf")
            || (href.contains("instruction") && href.ends_with(".pdf"))
            || (title.contains("instruction") && href.ends_with(".pdf"));

        if is_manual_link {
            let full_url = make_absolute_url(href, page_url);

            if is_related {
                let (source_name, source_year) = extract_source_kit_info(html, href);
                return Some(ScalematesManual {
                    pdf_url: full_url,
                    is_exact_match: false,
                    source_kit_name: source_name,
                    source_kit_year: source_year,
                });
            } else {
                return Some(ScalematesManual {
                    pdf_url: full_url,
                    is_exact_match: true,
                    source_kit_name: None,
                    source_kit_year: None,
                });
            }
        }
    }

    None
}

/// Try to extract source kit name and year from HTML context around the instructions link.
fn extract_source_kit_info(html: &str, _pdf_href: &str) -> (Option<String>, Option<String>) {
    // Look for patterns like "kit_name (year)" near the instructions section
    // The Scalemates page typically shows: "We don't have the exact instruction sheets, but we have them for:"
    // followed by a link to the related kit
    let marker = "but we have them for:";
    if let Some(pos) = html.find(marker) {
        let after = &html[pos + marker.len()..];
        // Look for the next anchor tag which should contain the source kit info
        if let Some(a_start) = after.find("<a") {
            if let Some(a_end) = after[a_start..].find("</a>") {
                let a_tag = &after[a_start..a_start + a_end + 4];
                // Extract text content from the anchor
                if let Some(text_start) = a_tag.find('>') {
                    let text = &a_tag[text_start + 1..];
                    let text = text.replace("</a>", "").replace("</a", "");
                    let text = text.trim().to_string();
                    // Try to split "Kit Name (2004)" pattern
                    if let Some(paren_pos) = text.rfind('(') {
                        let name = text[..paren_pos].trim().to_string();
                        let year = text[paren_pos + 1..].trim_end_matches(')').trim().to_string();
                        if !name.is_empty() {
                            return (
                                Some(name),
                                if year.len() == 4 && year.chars().all(|c| c.is_ascii_digit()) {
                                    Some(year)
                                } else {
                                    None
                                },
                            );
                        }
                    }
                    if !text.is_empty() {
                        return (Some(text), None);
                    }
                }
            }
        }
    }
    (None, None)
}

/// Make a potentially relative URL absolute using the page URL as base.
fn make_absolute_url(href: &str, page_url: &str) -> String {
    if href.starts_with("http") {
        href.to_string()
    } else {
        let base = extract_base_url(page_url);
        format!("{}{}", base, href)
    }
}

/// Extract the base URL (scheme + host) from a full URL.
fn extract_base_url(url: &str) -> String {
    if let Some(pos) = url.find("://") {
        if let Some(slash) = url[pos + 3..].find('/') {
            return url[..pos + 3 + slash].to_string();
        }
    }
    // Fallback
    "https://www.scalemates.com".to_string()
}
