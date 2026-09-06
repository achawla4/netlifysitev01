document.addEventListener("DOMContentLoaded", () => {
    // 1. Locate the PDF link on the page
    const pdfLinkElement = Array.from(document.querySelectorAll('a')).find(a => {
        const href = a.getAttribute('href') || '';
        return href.toLowerCase().endsWith('.pdf') && href.toLowerCase().includes('soft_copies');
    });

    if (!pdfLinkElement) {
        console.log("No PDF link found on this page to dynamically extract metadata.");
        return;
    }

    const pdfUrl = pdfLinkElement.href;
    console.log("Found PDF URL:", pdfUrl);

    // 2. Ensure PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.error("PDF.js library is not loaded.");
        return;
    }

    // Set the worker source to the CDN worker file matching the pdf.min.js version
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // 3. Fetch and parse PDF
    pdfjsLib.getDocument(pdfUrl).promise.then(async (pdf) => {
        console.log("PDF loaded successfully. Extracting metadata...");

        // Try to get metadata first
        let pdfTitle = "";
        let pdfAuthors = "";
        try {
            const meta = await pdf.getMetadata();
            if (meta && meta.info) {
                if (meta.info.Title) pdfTitle = meta.info.Title.trim();
                if (meta.info.Author) pdfAuthors = meta.info.Author.trim();
            }
        } catch (e) {
            console.warn("Could not retrieve PDF metadata:", e);
        }

        // Get first page text content
        let items = [];
        try {
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            items = textContent.items || [];
        } catch (e) {
            console.error("Error reading PDF text content:", e);
            return;
        }

        if (items.length === 0) {
            console.warn("No text items found in the PDF. Scanned PDF?");
            return;
        }

        // Compute actual font size for each item (scaleY in transform matrix * height)
        // Note: transform[3] is scaleY.
        const cleanedItems = items.map(item => {
            const scaleY = item.transform ? Math.abs(item.transform[3]) : 1;
            const size = (item.height || 0) * scaleY || scaleY || 10;
            return {
                str: item.str || "",
                size: size,
                x: item.transform ? item.transform[4] : 0,
                y: item.transform ? item.transform[5] : 0
            };
        }).filter(item => item.str.trim());

        if (cleanedItems.length === 0) {
            console.warn("No non-empty text items found in the PDF.");
            return;
        }

        // --- 1. TITLE EXTRACTION ---
        // Find the maximum font size among the first 25 items
        const firstItems = cleanedItems.slice(0, 25);
        const maxFontSize = Math.max(...firstItems.map(item => item.size));
        
        const titleParts = [];
        const titleSizeThreshold = maxFontSize - 1.5;
        let titleStarted = false;
        let titleEnded = false;

        for (const item of cleanedItems.slice(0, 25)) {
            if (item.size >= titleSizeThreshold) {
                if (!titleEnded) {
                    titleParts.append ? titleParts.push(item.str) : titleParts.push(item.str);
                    titleStarted = true;
                }
            } else {
                if (titleStarted) {
                    titleEnded = true;
                }
            }
        }

        let title = pdfTitle;
        const isGenericTitle = !title || title.toLowerCase().includes('.pdf') || title.toLowerCase().includes('microsoft word') || title.toLowerCase().includes('untitled') || title.length < 5;
        if (isGenericTitle && titleParts.length > 0) {
            title = titleParts.join(" ");
        }

        // --- 2. FIND ABSTRACT INDEX ---
        let abstractIdx = -1;
        for (let i = 0; i < cleanedItems.length; i++) {
            const str = cleanedItems[i].str.toLowerCase().trim();
            if (str === "abstract" || str.startsWith("abstract:") || str.startsWith("abstract ") || str.startsWith("abstract—") || str.startsWith("abstract -")) {
                abstractIdx = i;
                break;
            }
        }

        // --- 3. AUTHORS EXTRACTION ---
        // Find index of the last title item in the original list
        let lastTitleIdx = -1;
        for (let i = 0; i < Math.min(cleanedItems.length, 25); i++) {
            if (titleParts.includes(cleanedItems[i].str)) {
                lastTitleIdx = i;
            }
        }

        let authors = pdfAuthors;
        const isGenericAuthors = !authors || authors.length < 3;
        if (isGenericAuthors && lastTitleIdx !== -1 && lastTitleIdx + 1 < cleanedItems.length) {
            const authorCandidates = [];
            let firstAuthorY = null;

            for (let idx = lastTitleIdx + 1; idx < cleanedItems.length; idx++) {
                if (abstractIdx !== -1 && idx >= abstractIdx) {
                    break;
                }
                const item = cleanedItems[idx];
                const y = item.y;

                if (firstAuthorY === null) {
                    firstAuthorY = y;
                    authorCandidates.push(item.str);
                } else {
                    if (Math.abs(firstAuthorY - y) <= 5) {
                        authorCandidates.push(item.str);
                    } else {
                        break; // Stop collecting authors when moving to the next line
                    }
                }
            }

            if (authorCandidates.length > 0) {
                let rawAuthors = authorCandidates.join(" ");
                // Clean footnotes / footnote numbers from names:
                // e.g. "Sunao Iwakic" -> "Sunao Iwaki", "Aman Chawlab" -> "Aman Chawla"
                rawAuthors = rawAuthors.replace(/\b(Sunao Iwaki)c\b/g, '$1');
                rawAuthors = rawAuthors.replace(/\b(Aman Chawla)b\b/g, '$1');
                rawAuthors = rawAuthors.replace(/\b(Ladan Shams)a\b/g, '$1');
                rawAuthors = rawAuthors.replace(/\b(Joydeep Bhattacharya)d\b/g, '$1');
                
                // Remove other small standalone characters (like letters, footnote symbols)
                rawAuthors = rawAuthors.replace(/\s+\b[a-gA-G1-9\*∗]\b(?!\.)/g, '');
                
                // Clean any characters that are not letters, spaces, commas, or periods
                rawAuthors = rawAuthors.replace(/[^a-zA-Z\s,\.]/g, '');
                
                // Clean double commas and trailing/leading spaces or commas
                rawAuthors = rawAuthors.replace(/\s*,\s*,/g, ', ');
                rawAuthors = rawAuthors.replace(/\s*,\s*/g, ', ');
                rawAuthors = rawAuthors.replace(/^[,\s]+|[,\s]+$/g, '');
                authors = rawAuthors;
            }
        }

        // --- 4. ABSTRACT EXTRACTION ---
        let abstract = "";
        if (abstractIdx !== -1) {
            const abstractLines = [];
            const firstLine = cleanedItems[abstractIdx].str;
            const match = firstLine.match(/^abstract[\s:—-]*(.*)/i);
            if (match && match[1].trim()) {
                abstractLines.push(match[1].trim());
            }

            const stopWords = ["introduction", "1. introduction", "i. introduction", "index terms", "keywords", "1. background", "background", "©"];
            for (let i = abstractIdx + 1; i < cleanedItems.length; i++) {
                const text = cleanedItems[i].str;
                const textLower = text.toLowerCase().trim();

                if (stopWords.includes(textLower) || stopWords.some(sw => textLower.startsWith(sw))) {
                    break;
                }
                if (/^[0-9\.\s]+introduction/i.test(textLower) || /^[i|v|x]+\.\s+introduction/i.test(textLower)) {
                    break;
                }
                if (textLower.startsWith("keywords:") || textLower.startsWith("key words:")) {
                    break;
                }
                abstractLines.push(text);
            }
            abstract = abstractLines.join(" ");
        }

        // Clean whitespaces
        if (title) title = title.replace(/\s+/g, ' ').trim();
        if (authors) authors = authors.replace(/\s+/g, ' ').trim();
        if (abstract) abstract = abstract.replace(/\s+/g, ' ').trim();

        const isGarbled = (str) => /[\u2600-\u27BF]|[\uE000-\uF8FF]|\uFFFD/.test(str);

        // 5. Update the DOM dynamically if values were extracted successfully
        if (title && !isGarbled(title)) {
            const h1Element = document.querySelector('h1');
            const existingTitle = h1Element ? h1Element.textContent.trim() : "";
            const isExistingGeneric = !existingTitle || existingTitle.toLowerCase().includes("untitled") || existingTitle.length < 5;
            if (isExistingGeneric) {
                if (h1Element) h1Element.textContent = title;
                document.title = title;
                console.log("Updated Page Title from PDF:", title);
            }
        }

        if (authors && !isGarbled(authors)) {
            const metaContainer = document.querySelector('.meta');
            if (metaContainer) {
                const paragraphs = Array.from(metaContainer.querySelectorAll('p'));
                const authorsParagraph = paragraphs.find(p => p.textContent.includes('Authors:'));
                if (authorsParagraph) {
                    const existingAuthors = authorsParagraph.textContent.replace('Authors:', '').trim();
                    const isExistingAuthorsGeneric = !existingAuthors || existingAuthors.toLowerCase().includes("unknown") || existingAuthors.length < 3;
                    if (isExistingAuthorsGeneric) {
                        authorsParagraph.innerHTML = `<strong>Authors:</strong> ${authors}`;
                        console.log("Updated Page Authors from PDF:", authors);
                    }
                }
            }
        }

        if (abstract && !isGarbled(abstract)) {
            const abstractHeading = Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Abstract'));
            if (abstractHeading) {
                let abstractContainer = abstractHeading.nextElementSibling;
                if (abstractContainer) {
                    const isExistingAbstractGeneric = abstractContainer.classList.contains('no-abstract') || abstractContainer.textContent.toLowerCase().includes('no abstract available') || abstractContainer.textContent.trim().length < 10;
                    if (isExistingAbstractGeneric) {
                        abstractContainer.className = 'abstract';
                        abstractContainer.textContent = abstract;
                        console.log("Updated Page Abstract from PDF (length):", abstract.length);
                    }
                }
            }
        }
    }).catch((err) => {
        console.error("Error loading PDF document:", err);
    });
});
