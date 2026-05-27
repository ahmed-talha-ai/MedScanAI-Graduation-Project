"""
MediScan Medical Center - AI Agent Module

هذا الملف يحتوي على العقل الأساسي للمساعد الطبي الذكي
يتعامل مع المرضى باللهجة المصرية ويقدم خدمات طبية متقدمة
"""

import logging
import traceback
from typing import Any, AsyncGenerator
import asyncio
import requests
from langchain.agents import AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain.schema import OutputParserException
from langchain.callbacks.base import BaseCallbackHandler

from config import LLM, logger
from tools import ALL_TOOLS
from medical_history import get_history_manager, MedicalHistoryManager

# Custom exceptions for HuggingFace errors
class RateLimitError(Exception):
    """Rate limit error"""
    pass

class APIError(Exception):
    """API error"""
    pass

# ============================================================================
# STREAMING CALLBACK HANDLER
# ============================================================================

class StreamingCallbackHandler(BaseCallbackHandler):
    """معالج مخصص لدفق الردود"""
    
    def __init__(self):
        self.tokens = []
        self.current_response = ""
    
    def on_llm_new_token(self, token: str, **kwargs: Any) -> Any:
        """يُستدعى عند توليد كل كلمة جديدة"""
        self.tokens.append(token)
        self.current_response += token
    
    def get_response(self) -> str:
        """الحصول على الرد الحالي"""
        return self.current_response
    
    def reset(self):
        """إعادة تعيين المعالج لرد جديد"""
        self.tokens = []
        self.current_response = ""

# ============================================================================
# CUSTOM EXCEPTION CLASSES
# ============================================================================

class AgentError(Exception):
    """استثناء أساسي لأخطاء الوكيل"""
    pass

class ToolExecutionError(AgentError):
    """استثناء عند فشل تنفيذ أداة"""
    pass

class APIConnectionError(AgentError):
    """استثناء عند فشل الاتصال بالـ API"""
    pass

class ValidationError(AgentError):
    """استثناء عند فشل التحقق من المدخلات"""
    pass

# ============================================================================
# SYSTEM MESSAGES - Role-Based (Doctor/Patient)
# ============================================================================

# DOCTOR MODE: English, Clinical, Technical
DOCTOR_SYSTEM_MESSAGE = """You are **MediScan AI Medical Assistant** 🏥, an advanced clinical decision support system integrated into MediScan Medical Center.

## 🎯 Your Role:
You are a clinical AI assistant providing evidence-based medical support to healthcare professionals. Your responses should be:
- Professional and clinically precise
- Use standard medical terminology (ICD-10, SNOMED CT when relevant)
- Evidence-based with current clinical guidelines
- Suitable for clinical documentation

## 🏥 About MediScan Medical Center:
- **Location**: Main branch in Haram - Giza, with a second branch in Nasr City
- **Specialties**: AI-powered diagnostics for Dermatology, Brain Tumors, Chest Radiology
- **Full departments**: Internal Medicine, Cardiology, Orthopedics, OB/GYN, Pediatrics, and more
- **Hotline**: 16888 (24/7)

## 🕐 Operating Hours:
- **Sunday to Thursday**: 9:00 AM - 10:00 PM
- **Friday**: 2:00 PM - 8:00 PM  
- **Saturday**: Closed

## 📋 Your Capabilities:
1. **Medical Information**: Provide clinical interpretation of conditions, treatments, and investigations
2. **Image Analysis**: Analyze medical images using AI with clinical-grade reporting
3. **Differential Diagnosis**: Suggest differentials based on clinical presentation
4. **Drug Information**: Provide drug interactions, contraindications, and dosing considerations
5. **Appointment Booking**: Schedule patients with appropriate specialists
6. **Patient History**: Access and analyze patient medical records

## ⚕️ Clinical Response Guidelines:

### For Medical Queries:
- Provide clinical interpretation with pathophysiology when relevant
- List differential diagnoses in order of likelihood
- Suggest appropriate investigations
- Outline management strategies based on current guidelines
- Include relevant drug interactions or contraindications

### For Image Analysis:
- Provide structured radiological/pathological reports
- Use appropriate grading systems (BIRADS, Lung-RADS, etc.)
- Suggest follow-up imaging if indicated
- Note clinical correlations

### For Patient Records:
- Summarize relevant clinical history
- Highlight active problems and medications
- Flag potential drug interactions
- Note any warnings or allergies

## ⚠️ Important Disclaimers:
- This is a clinical decision support tool, not a replacement for clinical judgment
- All findings should be correlated clinically
- Final diagnosis and treatment decisions rest with the treating physician
- For emergency situations, advise immediate emergency department evaluation

## 🔧 Available Tools:
- retriever_tool: Access MediScan medical knowledge base
- websearch_tool: Search for current medical literature
- analyze_medical_image: AI-powered image analysis
- book_consultation: Schedule appointments
- get_current_datetime: Get current date/time

**Response Language: English ONLY - Professional clinical language**
"""

# PATIENT MODE: Egyptian Arabic, Simple, Reassuring
PATIENT_SYSTEM_MESSAGE = """أنت **مساعد MediScan الطبي الذكي** 🏥، روبوت طبي متطور بيساعد المرضى في مصر.

## 🎯 مهمتك الأساسية:
أنت مساعد طبي ذكي بتتكلم **باللهجة المصرية** علشان تكون قريب من المرضى. دورك:
- تقديم معلومات طبية دقيقة وموثوقة
- تحليل الصور الطبية بالذكاء الاصطناعي
- حجز المواعيد مع الأطباء المتخصصين
- الإجابة على الأسئلة عن خدمات المجمع

## 🏥 عن مجمع MediScan:
- **مجمع طبي مصري متخصص** في التشخيص بالذكاء الاصطناعي
- **التخصصات الرئيسية**: الأمراض الجلدية، الأورام الدماغية، الأشعة الصدرية
- **فيه أطباء في كل التخصصات**: باطنة، قلب، عظام، نساء، أطفال، وغيره
- **العناوين**: المقر الرئيسي في الهرم - الجيزة، وفرع في مدينة نصر
- **الخط الساخن**: 16888 (متاح 24/7)

## 🕐 أوقات العمل:
- **الأحد للخميس**: 9 صباحاً - 10 مساءً
- **الجمعة**: 2 ظهراً - 8 مساءً  
- **السبت**: مقفول

## 📋 إمكانياتك:
1. **معلومات طبية**: إجابة أي سؤال عن الأمراض والأعراض بطريقة بسيطة
2. **تحليل صور**: تحليل الأشعة والتحاليل بالذكاء الاصطناعي
3. **حجز مواعيد**: حجز مواعيد مع الدكاترة المتخصصين
4. **تاريخ طبي**: الاحتفاظ بسجل المريض وتتبع حالته

## ⚕️ إزاي ترد على المريض:

### لما حد يسأل سؤال طبي:
- اشرح بطريقة بسيطة ومطمئنة
- قوله يروح لأنهي دكتور متخصص
- استخدم كلمات سهلة مش مصطلحات معقدة

### لما حد يبعت صورة:
- حلل الصورة وقوله النتيجة ببساطة
- طمنه لو الحاجة مش خطيرة
- لو فيه مشكلة قوله يروح للدكتور

## 🚫 ممنوعات مهمة جداً (للمرضى):
- ❌ **ماتوصفش أدوية أبداً** - قول "الدكتور هيوصفلك العلاج المناسب"
- ❌ **ماتحددش جرعات** - قول "الجرعة الدكتور بيحددها"
- ❌ **ماتخوفش المريض** - كلمه بهدوء وطمنه
- ❌ **ماتديش تشخيص نهائي** - قول "ده تقدير مبدئي والدكتور هيأكد"

## ✅ دايماً قول:
- "روح لدكتور [التخصص]" - حدد التخصص المناسب
- "الدكتور هيفحصك ويأكدلك التشخيص"
- "لو الأعراض زادت روح المستشفى"

## 🔧 أدواتك:
- retriever_tool: البحث في قاعدة بيانات MediScan الطبية
- websearch_tool: البحث في الإنترنت عن معلومات طبية
- analyze_medical_image: تحليل الصور الطبية بالذكاء الاصطناعي
- book_consultation: حجز موعد مع دكتور
- get_current_datetime: معرفة التاريخ والوقت

## 🗣️ لهجتك المصرية:
**لازم تتكلم باللهجة المصرية 100%** - مش فصحى!

**القواعد:**
- استخدم "ده/دي/دول" بدل "هذا/هذه/هؤلاء"
- استخدم "إيه/ليه/إزاي" بدل "ما/لماذا/كيف"
- استخدم "عايز/محتاج" بدل "تريد/تحتاج"
- استخدم "كده/زي كده" بدل "هكذا/بهذا الشكل"
- استخدم "مفيش/ماينفعش" بدل "لا يوجد/لا يمكن"
- استخدم "بتاع/بتاعك" بدل "خاص بك"
- استخدم "دلوقتي" بدل "الآن"

**أمثلة صحيحة:**
- ✅ "النتيجة دي طبيعية" (مش ❌ "هذه النتيجة طبيعية")
- ✅ "عايز تعرف إيه تاني؟" (مش ❌ "ماذا تريد أن تعرف؟")
- ✅ "روح للدكتور علشان يشوفك" (مش ❌ "اذهب للطبيب لكي يفحصك")
- ✅ "مفيش حاجة تقلق منها" (مش ❌ "لا يوجد ما يدعو للقلق")

**ممنوع تماماً استخدام الفصحى في الردود!**
"""

# Default system message (for backward compatibility)
SYSTEM_MESSAGE = PATIENT_SYSTEM_MESSAGE

def get_system_message(user_role: str = "patient") -> str:
    """Get the appropriate system message based on user role."""
    if user_role.lower() == "doctor":
        return DOCTOR_SYSTEM_MESSAGE
    return PATIENT_SYSTEM_MESSAGE

# ============================================================================
# AGENT CONFIGURATION
# ============================================================================

from langchain.prompts import SystemMessagePromptTemplate, HumanMessagePromptTemplate

def create_react_prompt(user_role: str = "patient") -> ChatPromptTemplate:
    """Create a role-based ReAct prompt for the agent."""
    system_message = get_system_message(user_role)
    
    return ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_message),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template("""Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: think about what to do
Action: the action to take, must be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat)
Thought: I now know the final answer
Final Answer: your complete response to the user

⚠️ CRITICAL RULES ⚠️
1. EVERY response MUST end with "Final Answer: " followed by your answer
2. If you can answer directly WITHOUT a tool, skip Action entirely and write ONLY:
   Thought: I can answer this directly
   Final Answer: [your answer here]
3. If using a tool, after getting the Observation, you MUST write:
   Thought: I now know the final answer
   Final Answer: [your answer based on the observation]
4. NEVER write a response without "Final Answer:" at the end
5. NEVER write "Action: None" or skip to next line without Final Answer

Example for direct answer (no tool needed):
Question: What is diabetes?
Thought: I can answer this directly
Final Answer: """ + ("Diabetes mellitus is a metabolic disorder characterized by chronic hyperglycemia..." if user_role.lower() == "doctor" else "أهلاً بيك! السكر ده مرض بيأثر على نسبة السكر في الدم...") + """

Begin!

Question: {input}
{agent_scratchpad}""")
    ])

# Default prompt for backward compatibility (patient mode)
react_prompt = create_react_prompt("patient")

# Initialize the default agent (patient mode)
agent = create_react_agent(
    llm=LLM,
    tools=ALL_TOOLS,
    prompt=react_prompt,
)

def _handle_error(error) -> str:
    """
    Custom error handler for parsing errors.
    If the model answers directly without 'Final Answer:', extract and return it.
    """
    error_str = str(error)
    
    if "Could not parse LLM output" in error_str:
        # Try to extract the raw output from the error message
        # Format is typically: "Could not parse LLM output: `<output>`"
        try:
            if "`" in error_str:
                # Extract content between backticks
                start = error_str.find("`") + 1
                end = error_str.rfind("`")
                if start > 0 and end > start:
                    raw_output = error_str[start:end].strip()
                    # If it looks like a real answer (not empty, has some content)
                    if len(raw_output) > 20:
                        # Return as if it was a final answer by using AgentFinish format
                        return f"Observation: [Response extracted]\nFinal Answer: {raw_output}"
        except Exception:
            pass
        
        # Fallback: tell the agent to fix format (but reduce iterations to stop loop)
        return "Observation: Please write 'Final Answer:' before your response"
    
    return str(error)


def get_agent_executor(user_role: str = "patient") -> AgentExecutor:
    """
    Get an agent executor configured for the specified user role.
    
    Args:
        user_role: "doctor" for clinical/English mode, "patient" for Arabic/simple mode
    
    Returns:
        AgentExecutor configured with role-appropriate system message
    """
    # Create role-specific prompt
    role_prompt = create_react_prompt(user_role)
    
    # Create role-specific agent
    role_agent = create_react_agent(
        llm=LLM,
        tools=ALL_TOOLS,
        prompt=role_prompt,
    )
    
    # Create and return executor
    return AgentExecutor(
        agent=role_agent,
        tools=ALL_TOOLS,
        verbose=True,
        handle_parsing_errors=_handle_error,
        max_iterations=3,
        max_execution_time=45,
        early_stopping_method="generate",
    )


# Create default agent executor (patient mode - backward compatibility)
agent_executor = AgentExecutor(
    agent=agent,
    tools=ALL_TOOLS,
    verbose=True,
    handle_parsing_errors=_handle_error, 
    max_iterations=3,
    max_execution_time=45,
    early_stopping_method="generate",
)

# Initialize memory
memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    return_messages=True,
    max_window_size=10
)

# ============================================================================
# STREAMING AGENT FUNCTIONS
# ============================================================================

def extract_medical_info_from_chat(patient_id: str, user_message: str, ai_response: str):
    """
    استخراج المعلومات الطبية من المحادثة وحفظها في التاريخ المرضي
    """
    if not patient_id:
        return
    
    try:
        manager = get_history_manager()
        
        # Save chat record
        manager.add_record(
            patient_id=patient_id,
            record_type="chat",
            content=f"المريض: {user_message[:300]}\nالمساعد: {ai_response[:500]}",
            source="ai",
            severity="info"
        )
        
        # Extract conditions from user message
        condition_patterns = [
            r'عندي (سكر|ضغط|كوليسترول|أنيميا|حساسية)',
            r'بعاني من ([^\.,]+)',
            r'مريض ([^\.,]+)',
            r'عندي مرض ([^\.,]+)',
        ]
        
        import re
        for pattern in condition_patterns:
            matches = re.findall(pattern, user_message)
            for match in matches:
                if len(match) > 2:
                    manager.add_condition(patient_id, match.strip())
                    logger.info(f"📋 Extracted condition for {patient_id}: {match}")
        
        # Extract allergies
        allergy_patterns = [
            r'عندي حساسية من ([^\.,]+)',
            r'حساس من ([^\.,]+)',
        ]
        for pattern in allergy_patterns:
            matches = re.findall(pattern, user_message)
            for match in matches:
                history = manager.get_patient_history(patient_id)
                if match.strip() not in history.allergies:
                    history.allergies.append(match.strip())
                    manager.save_patient_history(history)
                    logger.info(f"⚠️ Extracted allergy for {patient_id}: {match}")
        
        # Extract warnings from AI response
        warnings = manager.extract_warnings_from_text(ai_response)
        if warnings:
            logger.info(f"⚠️ Found {len(warnings)} warnings in AI response")
        
    except Exception as e:
        logger.error(f"Error extracting medical info: {e}")


async def run_agent_streaming(user_input: str, patient_id: str = None, user_role: str = "patient", max_retries: int = 3) -> AsyncGenerator[str, None]:
    """
    تشغيل الوكيل مع دعم البث المباشر ومعالجة شاملة للأخطاء
    
    Args:
        user_input: رسالة المستخدم
        patient_id: معرف المريض لحفظ المحادثة في التاريخ المرضي
        user_role: 'doctor' (English/clinical) or 'patient' (Arabic/simple)
        max_retries: عدد المحاولات
    """
    # Get role-specific executor
    executor = get_agent_executor(user_role)
    
    # Input validation
    if not user_input or not user_input.strip():
        logger.warning("Empty input received")
        error_msg = "I didn't understand your question. Please rephrase." if user_role == "doctor" else "عذراً، مش فاهم سؤالك. ممكن تكتبه تاني؟"
        yield error_msg
        return
    
    # Load patient context if available
    patient_context = ""
    if patient_id:
        try:
            manager = get_history_manager()
            history = manager.get_patient_history(patient_id)
            if history.profile or history.conditions or history.medications:
                patient_context = f"""
[معلومات المريض المحفوظة]
- الاسم: {history.profile.get('name', 'غير محدد')}
- العمر: {history.profile.get('age', 'غير محدد')}
- فصيلة الدم: {history.blood_type if history.blood_type else 'غير محدد'}
- الأمراض المزمنة: {', '.join(history.conditions) if history.conditions else 'لا يوجد'}
- الأدوية الحالية: {', '.join([m['name'] for m in history.medications if m.get('active')]) if history.medications else 'لا يوجد'}
- الحساسية: {', '.join(history.allergies) if history.allergies else 'لا يوجد'}
- التاريخ العائلي: {', '.join([f"{{fh.get('relation', 'قريب')}}: {{fh.get('condition', 'غير محدد')}}" for fh in history.family_history]) if history.family_history else 'لا يوجد'}
"""
                logger.info(f"📋 Loaded patient context for: {patient_id}")
        except Exception as e:
            logger.warning(f"Could not load patient context: {e}")
    
    retry_count = 0
    last_error = None
    
    while retry_count <= max_retries:
        try:
            # Load conversation history
            chat_history = memory.load_memory_variables({})["chat_history"]
            
            logger.info(f"Processing user input (attempt {retry_count + 1}): {user_input[:50]}...")
            
            # Create streaming callback handler
            streaming_handler = StreamingCallbackHandler()
            
            # Create role-specific agent for streaming
            role_prompt = create_react_prompt(user_role)
            role_agent = create_react_agent(
                llm=LLM,
                tools=ALL_TOOLS,
                prompt=role_prompt,
            )
            
            # Create executor with streaming
            streaming_executor = AgentExecutor(
                agent=role_agent,
                tools=ALL_TOOLS,
                verbose=True,
                handle_parsing_errors=True,
                max_iterations=5,
                max_execution_time=60,
                callbacks=[streaming_handler]
            )
            
            # Run agent in background
            def run_sync():
                return streaming_executor.invoke({
                    "input": user_input.strip(),
                    "chat_history": chat_history
                })
            
            # Execute with streaming
            full_response = ""
            previous_length = 0
            
            loop = asyncio.get_event_loop()
            task = loop.run_in_executor(None, run_sync)
            
            # Stream response
            while not task.done():
                current_response = streaming_handler.get_response()
                
                if len(current_response) > previous_length:
                    new_content = current_response[previous_length:]
                    previous_length = len(current_response)
                    yield new_content
                
                await asyncio.sleep(0.1)
            
            # Get final result
            response = await task
            
            # Yield remaining content
            final_response = streaming_handler.get_response()
            if len(final_response) > previous_length:
                yield final_response[previous_length:]
            
            # If no streaming content, yield full response
            if not final_response and response and "output" in response:
                full_output = response["output"]
                words = full_output.split(' ')
                for word in words:
                    yield word + ' '
                    await asyncio.sleep(0.05)
            
            # Validate response
            if not response or "output" not in response:
                raise ValidationError("Invalid response format")
            
            if not response["output"] or not response["output"].strip():
                raise ValidationError("Empty response")
            
            # Save to memory
            memory.save_context(
                {"input": user_input},
                {"output": response["output"]}
            )
            
            # Save to patient medical history
            if patient_id:
                extract_medical_info_from_chat(patient_id, user_input, response["output"])
            
            logger.info(f"Successfully processed input: {user_input[:50]}...")
            return
            
        except RateLimitError as e:
            retry_count += 1
            last_error = e
            wait_time = min(2 ** retry_count, 60)
            
            logger.warning(f"Rate limit exceeded. Retrying in {wait_time}s... (Attempt {retry_count}/{max_retries})")
            
            if retry_count <= max_retries:
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error("Rate limit exceeded after max retries")
                yield "عذراً، النظام مشغول حالياً. ممكن تحاول تاني بعد شوية؟"
                return
                
        except APIError as e:
            retry_count += 1
            last_error = e
            logger.error(f"API error: {str(e)}")
            
            if retry_count <= max_retries:
                await asyncio.sleep(2)
                continue
            else:
                yield "عذراً، في مشكلة في الاتصال بالخدمة. جرب تاني بعد شوية."
                return
                
        except requests.exceptions.ConnectionError as e:
            retry_count += 1
            last_error = e
            logger.error(f"Connection error: {str(e)}")
            
            if retry_count <= max_retries:
                await asyncio.sleep(3)
                continue
            else:
                yield "عذراً، مفيش إنترنت حالياً. تأكد من الاتصال وحاول تاني."
                return
                
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            yield f"عذراً، حصل خطأ. لو المشكلة استمرت، اتصل بالدعم الفني على 16888."
            return
    
    logger.error(f"Max retries exceeded. Last error: {str(last_error)}")
    yield "عذراً، مقدرتش أعالج طلبك بعد محاولات كتير. حاول تاني بعدين أو اتصل بينا على 16888."


async def safe_run_agent_streaming(user_input: str, patient_id: str = None, user_role: str = "patient") -> AsyncGenerator[str, None]:
    """
    غلاف آمن لتشغيل الوكيل مع فحوصات إضافية
    
    Args:
        user_input: رسالة المستخدم
        patient_id: معرف المريض (اختياري)
        user_role: 'doctor' (English/clinical) or 'patient' (Arabic/simple)
    """
    is_doctor = user_role.lower() == "doctor"
    
    try:
        # Input type validation
        if not isinstance(user_input, str):
            logger.warning(f"Invalid input type: {type(user_input)}")
            yield "Invalid input data type." if is_doctor else "عذراً، في مشكلة في نوع البيانات المدخلة."
            return
        
        # Input length validation
        stripped_input = user_input.strip()
        
        if len(stripped_input) > 2000:
            logger.warning(f"Input too long: {len(stripped_input)} characters")
            yield "Message too long. Please shorten your query." if is_doctor else "عذراً، الرسالة طويلة جداً. ممكن تختصرها شوية؟"
            return
        
        if len(stripped_input) == 0:
            logger.warning("Empty input")
            yield "Please provide a valid query." if is_doctor else "عذراً، مش فاهم. ممكن تكتب سؤالك؟"
            return
        
        # Stream response with patient context and user role
        async for chunk in run_agent_streaming(user_input, patient_id=patient_id, user_role=user_role):
            yield chunk
        
    except Exception as e:
        logger.critical(f"Critical error in safe_run_agent_streaming: {str(e)}")
        logger.critical(f"Traceback: {traceback.format_exc()}")
        yield "عذراً، حصل خطأ خطير. اتصل بالدعم الفني فوراً على 16888."


def clear_memory() -> None:
    """مسح ذاكرة المحادثة"""
    try:
        memory.clear()
        logger.info("Memory cleared successfully")
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}")


def get_memory_summary() -> str:
    """الحصول على ملخص ذاكرة المحادثة"""
    try:
        memory_vars = memory.load_memory_variables({})
        return str(memory_vars.get("chat_history", "لا يوجد سجل محادثات"))
    except Exception as e:
        logger.error(f"Error getting memory summary: {str(e)}")
        return "خطأ في استرجاع السجل"

logger.info("=" * 60)
logger.info("🏥 MediScan AI Agent - Ready")
logger.info("💬 Language: Egyptian Arabic")
logger.info("🤖 Model: Qwen 2.5 72B Instruct")
logger.info("=" * 60)