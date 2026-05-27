import json
import os
import re
import sys

# Ensure terminal output supports UTF-8 on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

# ANSI colors for terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

EN_PATH = os.path.join(os.path.dirname(__file__), "..", "messages", "en.json")
AR_PATH = os.path.join(os.path.dirname(__file__), "..", "messages", "ar.json")
SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "src")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "i18n-report.txt")

# Ensure the scripts directory exists
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

# Helper to flatten nested JSON structure
def flatten_json(d, prefix=""):
    flat = {}
    for k, v in d.items():
        full_k = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            flat.update(flatten_json(v, full_k))
        else:
            flat[full_k] = v
    return flat

def main():
    report_lines = []
    
    def log(msg, color=None):
        clean_msg = re.sub(r'\033\[[0-9;]*m', '', msg)
        report_lines.append(clean_msg)
        if color:
            print(f"{color}{msg}{RESET}")
        else:
            print(msg)

    log("=" * 60)
    log("          MediScan AI — i18n Localization Audit")
    log("=" * 60)

    # Load JSON files
    try:
        with open(EN_PATH, 'r', encoding='utf-8') as f:
            en_data = json.load(f)
        with open(AR_PATH, 'r', encoding='utf-8') as f:
            ar_data = json.load(f)
    except Exception as e:
        log(f"❌ Failed to load JSON files: {str(e)}", RED)
        sys.exit(1)

    en_flat = flatten_json(en_data)
    ar_flat = flatten_json(ar_data)
    
    has_errors = False

    # -------------------------------------------------------------
    # Check 1: Key symmetry
    # -------------------------------------------------------------
    log("\n--- Check 1: Key Symmetry ---", CYAN)
    en_keys = set(en_flat.keys())
    ar_keys = set(ar_flat.keys())
    
    missing_in_ar = en_keys - ar_keys
    missing_in_en = ar_keys - en_keys
    
    if not missing_in_ar and not missing_in_en:
        log("✅ Key symmetry check passed! Both locales contain the exact same keys.", GREEN)
    else:
        has_errors = True
        if missing_in_ar:
            log(f"❌ Keys present in en.json but missing from ar.json ({len(missing_in_ar)}):", RED)
            for k in sorted(missing_in_ar):
                log(f"  - {k}", RED)
        if missing_in_en:
            log(f"❌ Keys present in ar.json but missing from en.json ({len(missing_in_en)}):", RED)
            for k in sorted(missing_in_en):
                log(f"  - {k}", RED)

    # -------------------------------------------------------------
    # Check 2: Empty values
    # -------------------------------------------------------------
    log("\n--- Check 2: Empty or Null Values ---", CYAN)
    empty_en = [k for k, v in en_flat.items() if v is None or str(v).strip() == ""]
    empty_ar = [k for k, v in ar_flat.items() if v is None or str(v).strip() == ""]
    
    if not empty_en and not empty_ar:
        log("✅ No empty or null values found in either locale file.", GREEN)
    else:
        has_errors = True
        if empty_en:
            log(f"❌ Empty values found in en.json ({len(empty_en)}):", RED)
            for k in sorted(empty_en):
                log(f"  - {k}", RED)
        if empty_ar:
            log(f"❌ Empty values found in ar.json ({len(empty_ar)}):", RED)
            for k in sorted(empty_ar):
                log(f"  - {k}", RED)

    # -------------------------------------------------------------
    # Check 3: Untranslated values & Character check
    # -------------------------------------------------------------
    log("\n--- Check 3: Untranslated & Misplaced Content ---", CYAN)
    
    # Check 3A: Latin only in ar.json (meaning it wasn't translated to Arabic)
    latin_only_re = re.compile(r'^[a-zA-Z0-9\s\-_.,!?:;@#%&*()\"\'\+/\\–—⚕️•{}|]*$')
    ignored_brands = sorted(["MediScan", "MediScan AI", "Xception", "DenseNet121", "ViT-Base", "EasyOCR", "Qwen", "BM25", "FAISS", "RAG"], key=len, reverse=True)
    ignored_placeholders = re.compile(r'^({[a-zA-Z0-9_]+}|••••••••|[0-9x\-:\s]+|OCR|AI Chat|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$')
    
    untranslated_ar = []
    for k, v in ar_flat.items():
        val_str = str(v).strip()
        if not val_str:
            continue
        if latin_only_re.match(val_str):
            # Check if it contains brand names or placeholder sequences only
            clean_str = val_str
            for brand in ignored_brands:
                clean_str = clean_str.replace(brand, "")
            clean_str = clean_str.strip()
            
            # If nothing is left or it matches placeholders only, ignore it
            if not clean_str or ignored_placeholders.match(clean_str):
                continue
                
            untranslated_ar.append((k, v))
            
    # Check 3B: Arabic characters in en.json
    arabic_chars_re = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
    arabic_in_en = []
    for k, v in en_flat.items():
        if arabic_chars_re.search(str(v)):
            arabic_in_en.append((k, v))
            
    if not untranslated_ar and not arabic_in_en:
        log("✅ Untranslated content checks passed! Locales contain appropriate language characters.", GREEN)
    else:
        has_errors = True
        if untranslated_ar:
            log(f"❌ Potentially untranslated English text in ar.json ({len(untranslated_ar)}):", RED)
            for k, v in sorted(untranslated_ar):
                log(f"  - {k}: {repr(v)}", RED)
        if arabic_in_en:
            log(f"❌ Misplaced Arabic characters in en.json ({len(arabic_in_en)}):", RED)
            for k, v in sorted(arabic_in_en):
                log(f"  - {k}: {repr(v)}", RED)

    # -------------------------------------------------------------
    # Check 4: Unused keys
    # -------------------------------------------------------------
    log("\n--- Check 4: Unused Translation Keys (Report Only) ---", CYAN)
    
    # Scan all TSX and TS files to extract t() usages and namespaces
    code_namespaces = []
    direct_keys_found = set()
    t_arguments = set()
    
    use_trans_re = re.compile(r'useTranslations\(\s*[\'"]([^\'"]+)[\'"]\s*\)')
    t_call_re = re.compile(r'\bt(?:Tools|Nav)?\(\s*[\'"]([^\'"]+)[\'"]\s*\)')
    
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Extract namespaces
                        ns_matches = use_trans_re.findall(content)
                        for ns in ns_matches:
                            code_namespaces.append(ns)
                            
                        # Extract t() calls
                        t_matches = t_call_re.findall(content)
                        for arg in t_matches:
                            t_arguments.add(arg)
                except Exception as e:
                    pass

    # Find unused keys by seeing if they resolve under any used namespaces or match directly
    unused_keys = []
    for k in sorted(en_flat.keys()):
        # Check if the key is directly referenced
        if k in t_arguments:
            continue
            
        # Check if it resolves within any namespace
        is_used = False
        for ns in code_namespaces:
            if k.startswith(ns + "."):
                sub_key = k[len(ns) + 1:]
                if sub_key in t_arguments:
                    is_used = True
                    break
        
        # Check if it is a nested/dynamic key used in parent maps (e.g. tools.brainTumor.title)
        # We also match if parts of the key are referenced
        if not is_used:
            for arg in t_arguments:
                if arg in k:
                    is_used = True
                    break
                    
        if not is_used:
            unused_keys.append(k)
            
    if not unused_keys:
        log("✅ All defined keys appear to be referenced in the codebase.", GREEN)
    else:
        # Note: Check 4 is report only, so we do not trigger has_errors
        log(f"⚠️  Found {len(unused_keys)} translation keys defined in JSONs but not directly referenced in code:", YELLOW)
        for k in unused_keys:
            log(f"  - {k}", YELLOW)

    # -------------------------------------------------------------
    # Check 5: Hardcoded strings (at least 4 words)
    # -------------------------------------------------------------
    log("\n--- Check 5: Hardcoded Strings in TSX (Report Only, >3 words) ---", CYAN)
    
    hardcoded_strings = []
    arabic_words_re = re.compile(r'[\u0600-\u06FF]+')
    
    # General regex for plain English/Latin strings inside JSX and curlies
    jsx_en_text_re = re.compile(r'>\s*([A-Za-z0-9\s.,!?:;\-\'\(\)⚕️•]+)\s*<')
    curly_en_text_re = re.compile(r'\{\s*[\'"]([A-Za-z0-9\s.,!?:;\-\'\(\)⚕️•]+)[\'"]\s*\}')
    
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        for line_no, line in enumerate(f, 1):
                            # Skip comments and imports
                            clean_line = line.split('//')[0].split('/*')[0].strip()
                            if clean_line.startswith(('import ', 'const ', 'type ', 'interface ')):
                                continue
                                
                            # Check Arabic plain text on line
                            if arabic_chars_re.search(clean_line):
                                # Extract Arabic strings
                                words = clean_line.split()
                                if len(words) > 3:  # Only strings with >3 words
                                    # Clean JSX markup or assignment characters
                                    clean_text = re.sub(r'<[^>]+>', '', clean_line)
                                    clean_text = clean_text.replace('"', '').replace("'", "").strip()
                                    hardcoded_strings.append((os.path.relpath(path, SRC_DIR), line_no, clean_text, "Arabic"))
                                    
                            # Check English plain text on line
                            en_matches = jsx_en_text_re.findall(clean_line)
                            for m in en_matches:
                                m_clean = m.strip()
                                words = m_clean.split()
                                if len(words) > 3:
                                    hardcoded_strings.append((os.path.relpath(path, SRC_DIR), line_no, m_clean, "English"))
                                    
                            en_matches_c = curly_en_text_re.findall(clean_line)
                            for m in en_matches_c:
                                m_clean = m.strip()
                                words = m_clean.split()
                                if len(words) > 3:
                                    hardcoded_strings.append((os.path.relpath(path, SRC_DIR), line_no, m_clean, "English"))
                except Exception as e:
                    pass

    if not hardcoded_strings:
        log("✅ No hardcoded multi-word strings found in `.tsx` files.", GREEN)
    else:
        # Note: Check 5 is report only, so we do not trigger has_errors
        log(f"⚠️  Found {len(hardcoded_strings)} hardcoded strings (>3 words) directly in JSX:", YELLOW)
        for rel_path, line_no, text, lang in hardcoded_strings:
            log(f"  - {rel_path}:{line_no} [{lang}] -> {repr(text)}", YELLOW)

    log("\n" + "=" * 60)
    if has_errors:
        log("❌ LOCALIZATION AUDIT FAILED (Check 1, 2, or 3 failed)", RED)
        log("=" * 60)
        # Write report to file
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write("\n".join(report_lines))
        sys.exit(1)
    else:
        log("✅ LOCALIZATION AUDIT PASSED (Checks 1, 2, and 3 are 100% green!)", GREEN)
        log("=" * 60)
        # Write report to file
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write("\n".join(report_lines))
        sys.exit(0)

if __name__ == "__main__":
    main()
