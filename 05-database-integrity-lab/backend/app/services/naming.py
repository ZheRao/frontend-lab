import re

def string_normalize(text: str) -> str:
    """
    Given a text input, 
        - convert to lower case
        - strip leading and trailing white space, replace all other whitespace by underscore, adjacent white spaces would be treated as one white space
    
    Note:
        - assuming input text is text, this function doesn't check and enforce that assumption
    """
    return re.sub(r'\s+', '_', text.strip().lower())
