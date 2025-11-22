from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

app = FastAPI(title="Network Defense Game API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files from db folder
db_path = Path(__file__).parent.parent / "db"
app.mount("/db", StaticFiles(directory=str(db_path)), name="db")


@app.get("/api/blocks")
async def get_blocks():
    """Returns list of available blocks (1-6)"""
    return {"blocks": [1, 2, 3, 4, 5, 6]}


def transform_block5_question(q, question_id):
    """Transform block5 question format to standard format"""
    # Get question type from 'type' field: "MCQ" = single_choice, "MSQ" = multiple_choice
    question_type = q.get("type", "MCQ").upper()
    if question_type == "MSQ":
        q_type = "multiple_choice"
    else:
        q_type = "single_choice"
    
    # Get correct answers from 'correct_answers' field (not 'answer'!)
    correct_answers = q.get("correct_answers", [])
    if not isinstance(correct_answers, list):
        correct_answers = [correct_answers] if correct_answers else []
    
    # Normalize correct answers for matching
    correct_normalized = [str(a).strip() for a in correct_answers]
    
    # Get options from 'options' field
    raw_options = q.get("options", [])
    if not raw_options:
        # Fallback: if no options, this shouldn't happen but handle it
        return {
            "id": question_id,
            "text": q.get("question", ""),
            "type": q_type,
            "options": []
        }
    
    # Transform options - use ONLY the options provided, mark correct ones
    options = []
    for idx, opt_text in enumerate(raw_options):
        opt_text_str = str(opt_text).strip()
        
        # Extract option ID (A, B, C, etc. or 1, 2, 3, etc. or use index)
        if "." in opt_text_str and opt_text_str[0].isalnum():
            # Has prefix like "A. " or "1. "
            opt_id = opt_text_str.split(".", 1)[0].strip()
            opt_text_clean = opt_text_str.split(".", 1)[1].strip()
        else:
            # No prefix, use letter (A, B, C...) or number
            opt_id = chr(65 + idx) if idx < 26 else str(idx + 1)
            opt_text_clean = opt_text_str
        
        # Check if this option is in correct_answers (exact match)
        is_correct = (
            opt_text_str in correct_normalized or
            opt_text_clean in correct_normalized
        )
        
        options.append({
            "id": opt_id,
            "text": opt_text_clean,
            "is_correct": is_correct
        })
    
    # Build transformed question
    transformed = {
        "id": question_id,
        "text": q.get("question", ""),
        "type": q_type,
        "options": options
    }
    
    return transformed


def transform_block6_question(q, question_id):
    """Transform block6 question format to standard format"""
    # Get correct answers from 'answer' field (array)
    correct_answers = q.get("answer", [])
    if not isinstance(correct_answers, list):
        correct_answers = [correct_answers] if correct_answers else []
    
    # Determine question type based on number of correct answers
    if len(correct_answers) > 1:
        q_type = "multiple_choice"
    else:
        q_type = "single_choice"
    
    # Normalize correct answers for matching
    correct_normalized = [str(a).strip() for a in correct_answers]
    
    # Get options from 'options' field
    raw_options = q.get("options", [])
    if not raw_options:
        return {
            "id": question_id,
            "text": q.get("question", ""),
            "type": q_type,
            "options": []
        }
    
    # Transform options - use ONLY the options provided, mark correct ones
    options = []
    for idx, opt_text in enumerate(raw_options):
        opt_text_str = str(opt_text).strip()
        
        # Extract option ID (A, B, C, etc. or 1, 2, 3, etc. or use index)
        if "." in opt_text_str and opt_text_str[0].isalnum():
            # Has prefix like "A. " or "1. "
            opt_id = opt_text_str.split(".", 1)[0].strip()
            opt_text_clean = opt_text_str.split(".", 1)[1].strip()
        else:
            # No prefix, use letter (A, B, C...) or number
            opt_id = chr(65 + idx) if idx < 26 else str(idx + 1)
            opt_text_clean = opt_text_str
        
        # Check if this option is in correct_answers (exact match)
        is_correct = (
            opt_text_str in correct_normalized or
            opt_text_clean in correct_normalized
        )
        
        options.append({
            "id": opt_id,
            "text": opt_text_clean,
            "is_correct": is_correct
        })
    
    # Build transformed question
    transformed = {
        "id": question_id,
        "text": q.get("question", ""),
        "type": q_type,
        "options": options
    }
    
    return transformed


@app.get("/api/questions/{block_id}")
async def get_questions(block_id: int):
    """Reads and returns questions from block{block_id}.json"""
    if block_id not in [1, 2, 3, 4, 5, 6]:
        raise HTTPException(status_code=404, detail="Block not found")
    
    questions_path = db_path / "questions" / f"block{block_id}.json"
    
    if not questions_path.exists():
        raise HTTPException(status_code=404, detail="Questions file not found")
    
    try:
        with open(questions_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Transform block5 format if needed
        if block_id == 5:
            # Block5 has modules structure
            all_questions = []
            question_counter = 1
            for module in data.get("modules", []):
                for q in module.get("questions", []):
                    transformed = transform_block5_question(q, question_counter)
                    all_questions.append(transformed)
                    question_counter += 1
            
            return {
                "meta": {
                    "topic": data.get("title", "AWS Academy Cloud Foundation"),
                    "source": "AWS Academy",
                    "version": "1.0",
                    "total_questions": len(all_questions)
                },
                "questions": all_questions
            }
        
        # Transform block6 format if needed
        if block_id == 6:
            # Block6 has questions array directly
            all_questions = []
            for q in data.get("questions", []):
                question_id = q.get("id", len(all_questions) + 1)
                transformed = transform_block6_question(q, question_id)
                all_questions.append(transformed)
            
            return {
                "meta": {
                    "topic": data.get("title", "AWS Academy Cloud Foundations Quiz"),
                    "source": "AWS Academy",
                    "version": "1.0",
                    "total_questions": len(all_questions)
                },
                "questions": all_questions
            }
        
        # Blocks 1-4 use standard format
        return data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
